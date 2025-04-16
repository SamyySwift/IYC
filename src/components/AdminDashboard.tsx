import { useEffect, useState, ChangeEvent } from "react";
import {
  Edit2,
  Trash2,
  LogOut,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react"; // Added Save, X, ChevronLeft, ChevronRight
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  metropolitan: string;
  area: string;
  district: string;
  assembly: string;
  goals: string; // Assuming goals are not editable in this simple implementation
  has_paid: boolean;
  created_at: string;
}

// Type for the editable form data, excluding non-editable fields
type EditFormData = Omit<
  Registration,
  "id" | "created_at" | "goals" | "has_paid"
>;

const ITEMS_PER_PAGE = 50;

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null); // State for form data
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations(currentPage);
  }, [currentPage]); // Re-fetch when currentPage changes

  const fetchRegistrations = async (page: number) => {
    setIsLoading(true);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from("registrations")
      .select("*", { count: "exact" }) // Request total count
      .order("created_at", { ascending: false })
      .range(from, to); // Fetch only the range for the current page

    if (error) {
      toast.error("Failed to fetch registrations");
      setRegistrations([]);
      setTotalCount(0);
    } else {
      setRegistrations(data || []);
      setTotalCount(count || 0); // Store the total count
    }
    setIsLoading(false);
    // Ensure editing mode is cancelled if the edited item is no longer on the current page
    if (editingId && !data?.find((reg) => reg.id === editingId)) {
      handleCancelClick();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const togglePaymentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ has_paid: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("Payment status updated");
      // Refetch current page data
      fetchRegistrations(currentPage);
    } catch (error) {
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
      // Check if the deleted item was the last on the page
      if (registrations.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1); // Go to previous page
      } else {
        fetchRegistrations(currentPage); // Refetch current page
      }
    } catch (error) {
      toast.error("Failed to delete registration");
    }
  };

  // --- Edit Handlers ---

  const handleEditClick = (registration: Registration) => {
    setEditingId(registration.id);
    // Populate form data with current registration details (only editable fields)
    const { id, created_at, goals, has_paid, ...editableData } = registration;
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
        .update(editFormData) // Update with data from editFormData state
        .eq("id", id);

      if (error) throw error;

      toast.success("Registration updated successfully");
      setEditingId(null); // Exit editing mode
      setEditFormData(null);
      fetchRegistrations(currentPage); // Refresh current page data
    } catch (error) {
      toast.error("Failed to update registration");
      console.error("Update error:", error);
    }
  };

  // --- Input Field Style ---
  const inputStyle =
    "bg-transparent border border-white/30 rounded px-2 py-1 w-full text-white/90 focus:outline-none focus:ring-1 focus:ring-blue-500";

  // --- Pagination Logic ---
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white max-w-xs">
          Admin Dashboard
        </h1>
        <div className="flex gap-2 items-center">
          <Link
            to="/"
            className="flex items-center gap-2 bg-gray-500 text-white rounded-lg px-4 py-2 p-3 hover:bg-gray-700" // Adjusted padding
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl overflow-x-auto mb-6">
        {" "}
        {/* Added mb-6 */}
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="text-white border-b border-white/20">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Phone</th>
              <th className="text-left py-3 px-4">Gender</th>
              <th className="text-left py-3 px-4">Metropolitan</th>
              <th className="text-left py-3 px-4">Area</th>
              <th className="text-left py-3 px-4">District</th>
              <th className="text-left py-3 px-4">Assembly</th>
              <th className="text-left py-3 px-4">Payment Status</th>
              <th className="text-left py-3 px-4 min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-white/70">
                  Loading registrations...
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-white/70">
                  No registrations found.
                </td>
              </tr>
            ) : (
              registrations.map((registration) =>
                editingId === registration.id ? (
                  // --- Edit Row ---
                  <tr
                    key={registration.id}
                    className="text-white/90 border-b border-white/10 bg-blue-900/20" // Highlight editing row
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
                      <input
                        type="text"
                        name="metropolitan"
                        value={editFormData?.metropolitan || ""}
                        onChange={handleEditFormChange}
                        className={inputStyle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        name="area"
                        value={editFormData?.area || ""}
                        onChange={handleEditFormChange}
                        className={inputStyle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        name="district"
                        value={editFormData?.district || ""}
                        onChange={handleEditFormChange}
                        className={inputStyle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        name="assembly"
                        value={editFormData?.assembly || ""}
                        onChange={handleEditFormChange}
                        className={inputStyle}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          registration.has_paid
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {registration.has_paid ? "Paid" : "Unpaid"}
                      </span>
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
                    <td className="py-3 px-4">{registration.metropolitan}</td>
                    <td className="py-3 px-4">{registration.area}</td>
                    <td className="py-3 px-4">{registration.district}</td>
                    <td className="py-3 px-4">{registration.assembly}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          togglePaymentStatus(
                            registration.id,
                            registration.has_paid
                          )
                        }
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                          registration.has_paid
                            ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        }`}
                        title="Toggle Payment Status"
                      >
                        {registration.has_paid ? "Paid" : "Unpaid"}
                      </button>
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
