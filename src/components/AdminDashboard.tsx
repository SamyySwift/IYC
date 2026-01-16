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
  MinusCircle,
  CreditCard,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion"; // Corrected import based on common usage and context
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { format, isSunday, addDays, startOfMonth } from "date-fns";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  is_new_member: boolean;
  group_number: number | null;
  created_at: string;
}

type FilterStatus = "All" | "Present" | "Absent" | "Unmarked" | "Paid" | "Unpaid" | "New Member" | "Group 1" | "Group 2" | "Group 3" | "Group 4";

// Type for the editable form data, excluding non-editable fields
type EditFormData = Omit<
  Registration,
  "id" | "created_at"
>;

const ITEMS_PER_PAGE = 50;

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
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<{ present: number; absent: number }>({ present: 0, absent: 0 });
  const [showPayAllModal, setShowPayAllModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState<{ id: string; name: string } | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
            navigate("/admin/login");
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchRegistrations(currentPage);
    fetchAttendance();
    fetchMonthlyDues();
    fetchStats();
  }, [currentPage, attendanceDate, filterStatus]);

  const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          navigate("/admin/login");
      } else {
          setAdminEmail(session.user.email ?? null);
      }
  };

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
       } else if (filterStatus === "Paid") {
           const dateObj = new Date(attendanceDate);
           const startOfMonthStr = format(startOfMonth(dateObj), "yyyy-MM-dd");
           
           const { data: dueData } = await supabase
             .from("monthly_dues")
             .select("registration_id")
             .eq("month_year", startOfMonthStr);

           const ids = dueData?.map((d: any) => d.registration_id) || [];
           
           if (ids.length === 0) {
               query = query.in("id", ["00000000-0000-0000-0000-000000000000"]); 
           } else {
               query = query.in("id", ids);
           }
       } else if (filterStatus === "Unpaid") {
           const dateObj = new Date(attendanceDate);
           const startOfMonthStr = format(startOfMonth(dateObj), "yyyy-MM-dd");
           
           const { data: dueData } = await supabase
             .from("monthly_dues")
             .select("registration_id")
             .eq("month_year", startOfMonthStr);

           const ids = dueData?.map((d: any) => d.registration_id) || [];
           
           if (ids.length > 0) {
              query = query.not("id", "in", `(${ids.join(",")})`);
           }
       } else if (filterStatus.startsWith("Group")) {
          const groupNum = parseInt(filterStatus.split(" ")[1]);
          query = query.eq("group_number", groupNum);
       } else if (filterStatus === "New Member") {
          query = query.eq("is_new_member", true);
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

  const handleUnmarkAttendance = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("registration_id", registrationId)
        .eq("date", attendanceDate);

      if (error) throw error;
      
      const newMap = { ...attendanceMap };
      delete newMap[registrationId];
      setAttendanceMap(newMap);
      
      toast.success("Attendance unmarked");
      fetchStats();
      if (filterStatus !== "All") {
          fetchRegistrations(currentPage);
      }
    } catch (error) {
      console.error("Error unmarking attendance:", error);
      toast.error("Failed to unmark attendance");
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
      fetchMonthlyDues(); 
      // Re-fetch list if we are filtering by payment status
      if (filterStatus === "Paid" || filterStatus === "Unpaid") {
          fetchRegistrations(currentPage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update payment status");
    }
  };
  const handlePayAllMonths = async () => {
    if (!selectedReg) return;
    const currentYear = new Date().getFullYear();

    try {
      const records = Array.from({ length: 12 }, (_, i) => ({
        registration_id: selectedReg.id,
        month_year: `${currentYear}-${String(i + 1).padStart(2, '0')}-01`,
        amount: 0,
      }));

      const { error } = await supabase
        .from("monthly_dues")
        .upsert(records, { onConflict: "registration_id, month_year" });

      if (error) throw error;

      toast.success(`Marked all months of ${currentYear} as paid for ${selectedReg.name}`);
      setShowPayAllModal(false);
      setSelectedReg(null);
      fetchMonthlyDues();
      if (filterStatus === "Paid" || filterStatus === "Unpaid") {
        fetchRegistrations(currentPage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update bulk payment");
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
    const { id, created_at, ...editableData } = registration;
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-inter text-white relative">
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold font-syne tracking-tighter mb-2">
              Management <span className="text-purple-400">Hub</span>
            </h1>
            {adminEmail && (
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
                Session Active: <span className="text-white/60">{adminEmail}</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 items-center justify-center">
             {/* Filter Dropdown */}
            <div className="glass rounded-full px-6 py-3 flex items-center gap-3">
                <Filter className="w-4 h-4 text-white/30" />
                <select 
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value as FilterStatus);
                        setCurrentPage(1);
                    }}
                    className="bg-transparent text-sm font-bold uppercase tracking-widest focus:outline-none [&>option]:text-black cursor-pointer"
                >
                    <option value="All">All Status</option>
                    <option value="Present">Attendance: Present</option>
                    <option value="Absent">Attendance: Absent</option>
                    <option value="Unmarked">Attendance: Unmarked</option>
                    <option value="Paid">Payment: Paid</option>
                    <option value="Unpaid">Payment: Unpaid</option>
                    <option value="New Member">New Members</option>
                    <option value="Group 1">Group 1</option>
                    <option value="Group 2">Group 2</option>
                    <option value="Group 3">Group 3</option>
                    <option value="Group 4">Group 4</option>
                </select>
            </div>

             {/* Date Picker */}
            <div className="glass rounded-full px-6 py-3 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-white/30" />
                <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-transparent text-sm font-bold uppercase tracking-widest focus:outline-none cursor-pointer"
                />
            </div>
            
            <div className="flex gap-2">
              <Link
                  to="/"
                  className="glass p-3 rounded-full hover:bg-white/10 transition-colors"
                  title="Home"
              >
                  <Home className="w-5 h-5" />
              </Link>
              <button
                  onClick={handleLogout}
                  className="glass p-3 rounded-full hover:bg-red-500/20 text-red-400 transition-colors"
                  title="Logout"
              >
                  <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 px-4 md:px-0">
            {[
              { label: "Total Registrations", value: totalCount, color: "white" },
              { label: "Present Today", value: stats.present, color: "green" },
              { label: "Absent Today", value: stats.absent, color: "red" }
            ].map((stat, i) => (
              <div key={i} className="glass rounded-2xl p-8 border border-white/5 relative overflow-hidden group">
                <div className="relative z-10 lowercase">
                  <h3 className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</h3>
                  <p className="text-5xl font-bold font-syne tracking-tighter transition-transform duration-500 group-hover:scale-110 origin-left">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
        </div>

        {/* Table Section */}
        <div className="glass rounded-[2rem] p-1 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="overflow-x-auto p-4 md:p-8">
            <table className="w-full min-w-[1000px] border-separate border-spacing-y-4">
              <thead>
                <tr className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em]">
                  <th className="text-left py-4 px-6">Name</th>
                  <th className="text-left py-4 px-6">Contact Details</th>
                  <th className="text-center py-4 px-6">New member?</th>
                  <th className="text-center py-4 px-6">Group</th>
                  <th className="text-center py-4 px-6">Payment</th>
                  <th className="text-center py-4 px-6">Attendance</th>
                  <th className="text-right py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-white/20 animate-pulse uppercase tracking-[0.3em] text-xs">
                      Synchronizing Data...
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-white/20 uppercase tracking-[0.3em] text-xs">
                      No Records Discovered
                    </td>
                  </tr>
                ) : (
                  registrations.map((registration) => (
                    <motion.tr
                      key={registration.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group transition-all duration-300 ${
                        editingId === registration.id ? "bg-purple-500/5 ring-1 ring-purple-500/20" : ""
                      }`}
                    >
                      {editingId === registration.id ? (
                        <>
                          <td className="py-4 px-6">
                            <input
                              type="text"
                              name="full_name"
                              value={editFormData?.full_name || ""}
                              onChange={handleEditFormChange}
                              className="bg-white/5 border-b border-purple-500/50 w-full py-1 px-1 focus:outline-none text-white"
                            />
                          </td>
                          <td className="py-4 px-6">
                            <input
                                type="email"
                                name="email"
                                value={editFormData?.email || ""}
                                onChange={handleEditFormChange}
                                className="bg-white/5 border-b border-white/10 w-full py-1 px-1 focus:outline-none text-white text-sm mb-1 block"
                            />
                            <input
                                type="tel"
                                name="phone"
                                value={editFormData?.phone || ""}
                                onChange={handleEditFormChange}
                                className="bg-white/5 border-b border-white/10 w-full py-1 px-1 focus:outline-none text-white text-sm block"
                            />
                          </td>
                          <td className="py-4 px-6 text-center">
                            <input
                              type="checkbox"
                              checked={editFormData?.is_new_member || false}
                              onChange={(e) => editFormData && setEditFormData({ ...editFormData, is_new_member: e.target.checked })}
                              className="w-4 h-4 accent-purple-500"
                            />
                          </td>
                          <td className="py-4 px-6 text-center">
                            <select
                              value={editFormData?.group_number || ""}
                              onChange={(e) => editFormData && setEditFormData({ ...editFormData, group_number: e.target.value ? parseInt(e.target.value) : null })}
                              className="bg-[#1A1A1A] border border-white/10 rounded px-2 py-1 text-xs"
                            >
                              <option value="">-</option>
                              {[1, 2, 3, 4].map(n => <option key={n} value={n}>G{n}</option>)}
                            </select>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-[10px] text-white/30 uppercase font-bold">In Edit Mode</span>
                          </td>
                          <td className="py-4 px-6 text-center text-white/20 text-xs">-</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleSaveClick(registration.id)} className="p-2 hover:text-green-400 transition-colors"><Save className="w-4 h-4" /></button>
                              <button onClick={handleCancelClick} className="p-2 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-4 px-6">
                            <span className="text-white font-medium block">{registration.full_name}</span>
                            <span className="text-white/20 text-[10px] uppercase font-bold tracking-widest block mt-1">
                              ID: {registration.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-white/60 text-sm block lowercase">{registration.email}</span>
                            <span className="text-white/40 text-[11px] block mt-1">{registration.phone}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {registration.is_new_member ? (
                              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border border-purple-500/20">New Member</span>
                            ) : (
                              <span className="text-white/10 text-[10px] uppercase font-bold tracking-widest">Regular</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {registration.group_number ? (
                              <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border border-blue-500/20">Group {registration.group_number}</span>
                            ) : (
                              <span className="text-white/10 text-xs">None</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <button
                                onClick={() => togglePaymentStatus(registration.id, paidMap[registration.id])}
                                className={`px-4 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all ${
                                  paidMap[registration.id]
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}
                              >
                                {paidMap[registration.id] ? "Paid" : "Unpaid"}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReg({ id: registration.id, name: registration.full_name });
                                  setShowPayAllModal(true);
                                }}
                                className="text-white/20 hover:text-white transition-colors p-1"
                                title="Bulk Pay All Year"
                              >
                                <CreditCard className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-1">
                                <button
                                    onClick={() => handleAttendance(registration.id, "Present")}
                                    className={`p-2 rounded-lg transition-all ${
                                        attendanceMap[registration.id] === "Present"
                                            ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                            : "opacity-20 hover:opacity-100 text-white"
                                    }`}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleAttendance(registration.id, "Absent")}
                                    className={`p-2 rounded-lg transition-all ${
                                        attendanceMap[registration.id] === "Absent"
                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                            : "opacity-20 hover:opacity-100 text-white"
                                    }`}
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                                {attendanceMap[registration.id] && (
                                  <button
                                      onClick={() => handleUnmarkAttendance(registration.id)}
                                      className="p-2 opacity-20 hover:opacity-100 hover:text-blue-400 transition-all"
                                  >
                                      <MinusCircle className="w-5 h-5" />
                                  </button>
                                )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditClick(registration)}
                                className="p-2 hover:text-blue-400 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(registration.id)}
                                className="p-2 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-8 mt-16 pb-16">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="glass p-4 rounded-full disabled:opacity-20 transition-all hover:bg-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/30 uppercase font-bold tracking-[0.3em] mb-1">Index</span>
              <span className="text-xl font-bold font-syne">{currentPage} / {totalPages}</span>
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="glass p-4 rounded-full disabled:opacity-20 transition-all hover:bg-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Bulk Payment Modal */}
      {showPayAllModal && selectedReg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowPayAllModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass rounded-[2rem] p-12 w-full max-w-xl relative z-10 shadow-2xl text-center"
          >
            <CreditCard className="w-16 h-16 text-purple-400 mx-auto mb-8" />
            <h3 className="text-3xl font-bold font-syne tracking-tighter text-white mb-4">
              Authorize Bulk Payment
            </h3>
            <p className="text-white/50 text-lg font-light mb-12">
              Mark all 12 months of <span className="text-white font-bold">{new Date().getFullYear()}</span> as paid for <span className="text-white font-bold">{selectedReg.name}</span>?
            </p>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => setShowPayAllModal(false)}
                className="flex-1 px-8 py-4 glass rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePayAllMonths}
                className="flex-1 px-8 py-4 bg-white text-black rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all shadow-xl"
              >
                Confirm Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
