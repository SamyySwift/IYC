import { useState, useEffect, ChangeEvent } from "react";
import {
  Edit2,
  Trash2,
  LogOut,
  Save,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { format, isSunday, addDays, startOfMonth } from "date-fns";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  goals: string;
  // has_paid: boolean; // Deprecated in favor of monthly_dues
  created_at: string;
}

type FilterStatus = "All" | "Present" | "Absent" | "Unmarked";

console.log("");

// Type for the editable form data, excluding non-editable fields
type EditFormData = Omit<
  Registration,
  "id" | "created_at" | "goals"
>;

const ITEMS_PER_PAGE = 10;

// Helper to get nearest Sunday (Today if Sunday, or next Sunday)
const getInitialDate = () => {
  const today = new Date();
  if (isSunday(today)) return format(today, "yyyy-MM-dd");
  return format(addDays(today, (7 - today.getDay()) % 7 || 7), "yyyy-MM-dd");
};

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(getInitialDate());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "Present" | "Absent">>({});
  const [paidMap, setPaidMap] = useState<Record<string, boolean>>({}); // True if paid for the selected month
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations(currentPage);
    fetchAttendance();
    fetchMonthlyDues();
  }, [currentPage, attendanceDate, filterStatus]);

  const fetchRegistrations = async (page: number) => {
    setIsLoading(true);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("registrations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply Filters
    if (filterStatus !== "All") {
       if (filterStatus === "Present" || filterStatus === "Absent") {
           const { data: attData } = await supabase
             .from("attendance")
             .select("registration_id")
             .eq("date", attendanceDate)
             .eq("status", filterStatus);
           
           const ids = attData?.map((d: any) => d.registration_id) || [];
           
           if (ids.length === 0) {
               query = query.in("id", ["00000000-0000-0000-0000-000000000000"]); 
           } else {
               query = query.in("id", ids);
           }
       } else if (filterStatus === "Unmarked") {
           const { data: attData } = await supabase
             .from("attendance")
             .select("registration_id")
             .eq("date", attendanceDate);
             
           const ids = attData?.map((d: any) => d.registration_id) || [];
           
           if (ids.length > 0) {
               query = query.not("id", "in", `(${ids.join(",")})`);
           }
       }
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      toast.error("Failed to fetch registrations");
      setRegistrations([]);
      setTotalCount(0);
    } else {
      setRegistrations(data || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
    
    if (editingId && !data?.find((reg) => reg.id === editingId)) {
      handleCancelClick();
    }
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("registration_id, status")
      .eq("date", attendanceDate);

    if (error) {
      console.error("Error fetching attendance:", error);
      return;
    }

    const map: Record<string, "Present" | "Absent"> = {};
    data?.forEach((record: any) => {
      map[record.registration_id] = record.status;
    });
    setAttendanceMap(map);
  };

  const fetchMonthlyDues = async () => {
      // Calculate start of month for the SELECTED date
      const dateObj = new Date(attendanceDate);
      const startOfMonthStr = format(startOfMonth(dateObj), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("monthly_dues")
        .select("registration_id")
        .eq("month_year", startOfMonthStr);

      if (error) {
          console.error("Error fetching dues:", error);
          return;
      }

      const map: Record<string, boolean> = {};
      data?.forEach((record: any) => {
          map[record.registration_id] = true;
      });
      setPaidMap(map);
  };

  const handleAttendance = async (registrationId: string, status: "Present" | "Absent") => {
    try {
      setAttendanceMap((prev) => ({ ...prev, [registrationId]: status }));

      const { error } = await supabase
        .from("attendance")
        .upsert(
          { 
            registration_id: registrationId, 
            status, 
            date: attendanceDate 
          },
          { onConflict: "registration_id, date" }
        );

      if (error) throw error;
      toast.success(`Marked as ${status}`);
      if (filterStatus !== "All") {
          fetchRegistrations(currentPage);
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to update attendance");
      fetchAttendance();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const togglePaymentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const dateObj = new Date(attendanceDate);
      const startOfMonthStr = format(startOfMonth(dateObj), "yyyy-MM-dd");

      if (currentStatus) {
          // It was true, so we are flipping to false -> DELETE record
          const { error } = await supabase
            .from("monthly_dues")
            .delete()
            .eq("registration_id", id)
            .eq("month_year", startOfMonthStr);
          
          if (error) throw error;
      } else {
          // It was false, flip to true -> INSERT record
           const { error } = await supabase
            .from("monthly_dues")
            .insert({
                registration_id: id,
                month_year: startOfMonthStr,
                amount: 0 // Default or handle amounts later
            });
            
          if (error) throw error;
      }

      toast.success("Payment status updated");
      fetchMonthlyDues(); // update local state
    } catch (error) {
      console.error(error);
      toast.error("Failed to update payment status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;

    try {
      const { error } = await supabase
        .from("registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Registration deleted");
      if (registrations.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchRegistrations(currentPage);
      }
    } catch (error) {
      toast.error("Failed to delete registration");
    }
  };

  // --- Edit Handlers ---

  const handleEditClick = (registration: Registration) => {
    setEditingId(registration.id);
    const { id, created_at, goals, ...editableData } = registration;
    setEditFormData(editableData);
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editFormData) return;
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleSaveClick = async (id: string) => {
    if (!editFormData) return;

    try {
      const { error } = await supabase
        .from("registrations")
        .update(editFormData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Registration updated successfully");
      setEditingId(null);
      setEditFormData(null);
      fetchRegistrations(currentPage);
    } catch (error) {
      toast.error("Failed to update registration");
      console.error("Update error:", error);
    }
  };

  const inputStyle =
    "bg-transparent border border-white/30 rounded px-2 py-1 w-full text-white/90 focus:outline-none focus:ring-1 focus:ring-blue-500";

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const [stats, setStats] = useState<{ present: number; absent: number }>({ present: 0, absent: 0 });
  
  useEffect(() => {
     fetchStats();
  }, [attendanceDate, attendanceMap]); 

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("status")
      .eq("date", attendanceDate);
      
    if (!error && data) {
       const present = data.filter(d => d.status === 'Present').length;
       const absent = data.filter(d => d.status === 'Absent').length;
       setStats({ present, absent });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 font-chillax">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white max-w-xs">
          Admin Dashboard
        </h1>
        
        <div className="flex flex-wrap gap-4 items-center justify-center">
             {/* Filter Dropdown */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <Filter className="w-4 h-4 text-white/70" />
                <select 
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value as FilterStatus);
                        setCurrentPage(1); // Reset page on filter change
                    }}
                    className="bg-transparent text-white focus:outline-none [&>option]:text-black"
                >
                    <option value="All">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Unmarked">Unmarked</option>
                </select>
            </div>

             {/* Date Picker */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-white/70" />
                <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-transparent text-white focus:outline-none"
                />
            </div>
            
            <Link
                to="/"
                className="flex items-center gap-2 bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors"
            >
                <Home className="w-4 h-4" />
                Home
            </Link>
            <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
                <LogOut className="w-4 h-4" />
                Logout
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/10">
              <h3 className="text-white/60 text-sm font-medium mb-1">Total Registrations</h3>
              <p className="text-3xl font-bold text-white">{totalCount}</p>
          </div>
          <div className="bg-green-500/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-green-500/20">
              <h3 className="text-green-300/80 text-sm font-medium mb-1">Present Today</h3>
              <p className="text-3xl font-bold text-green-400">{stats.present}</p>
          </div>
          <div className="bg-red-500/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-red-500/20">
              <h3 className="text-red-300/80 text-sm font-medium mb-1">Absent Today</h3>
              <p className="text-3xl font-bold text-red-400">{stats.absent}</p>
          </div>
      </div>

      {/* Table Container */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl overflow-x-auto mb-6">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="text-white border-b border-white/20">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Phone</th>
              <th className="text-left py-3 px-4">Gender</th>
              <th className="text-left py-3 px-4">Payment Status</th>
               <th className="text-center py-3 px-4">Attendance</th>
              <th className="text-left py-3 px-4 min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-white/70">
                  Loading registrations...
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-white/70">
                  No registrations found.
                </td>
              </tr>
            ) : (
              registrations.map((registration) =>
                editingId === registration.id ? (
                  // --- Edit Row ---
                  <tr
                    key={registration.id}
                    className="text-white/90 border-b border-white/10 bg-blue-900/20"
                  >
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        name="full_name"
                        value={editFormData?.full_name || ""}
                        onChange={handleEditFormChange}
                        className={inputStyle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="email"
                        name="email"
                        value={editFormData?.email || ""}
                        onChange={handleEditFormChange}
                        className={inputStyle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="tel"
                        name="phone"
                        value={editFormData?.phone || ""}
                        onChange={handleEditFormChange}
                        className={inputStyle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        name="gender"
                        value={editFormData?.gender || ""}
                        onChange={handleEditFormChange}
                        className={inputStyle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          paidMap[registration.id]
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {paidMap[registration.id] ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center text-white/30">
                        (Edit Mode)
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveClick(registration.id)}
                          className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Save Changes"
                        >
                          <Save className="w-4 h-4 text-green-400" />
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="p-2 hover:bg-gray-500/20 rounded-lg transition-colors"
                          title="Cancel Edit"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // --- Display Row ---
                  <tr
                    key={registration.id}
                    className="text-white/90 border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">{registration.full_name}</td>
                    <td className="py-3 px-4">{registration.email}</td>
                    <td className="py-3 px-4">{registration.phone}</td>
                    <td className="py-3 px-4">{registration.gender}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          togglePaymentStatus(
                            registration.id,
                            paidMap[registration.id]
                          )
                        }
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                          paidMap[registration.id]
                            ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        }`}
                        title="Toggle Payment Status"
                      >
                        {paidMap[registration.id] ? "Paid" : "Unpaid"}
                      </button>
                    </td>
                    {/* Attendance Controls */}
                    <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => handleAttendance(registration.id, "Present")}
                                className={`p-2 rounded-lg transition-colors border ${
                                    attendanceMap[registration.id] === "Present"
                                        ? "bg-green-500 text-white border-green-500"
                                        : "bg-transparent text-white/30 border-white/20 hover:border-green-500/50 hover:text-green-500/50"
                                }`}
                                title="Mark Present"
                            >
                                <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleAttendance(registration.id, "Absent")}
                                className={`p-2 rounded-lg transition-colors border ${
                                    attendanceMap[registration.id] === "Absent"
                                        ? "bg-red-500 text-white border-red-500"
                                        : "bg-transparent text-white/30 border-white/20 hover:border-red-500/50 hover:text-red-500/50"
                                }`}
                                title="Mark Absent"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(registration)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Edit Registration"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(registration.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete Registration"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 text-white">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || isLoading}
            className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading}
            className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
