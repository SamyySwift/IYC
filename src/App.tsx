import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import RegistrationForm from "./components/RegistrationForm";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminRegistration from "./components/AdminRegistration";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import CustomCursor from "./components/ui/CustomCursor";

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[#0A0A0A] relative overflow-hidden font-inter selection:bg-purple-500/30">
        <CustomCursor />
        <div className="noise-overlay" />
        <Toaster position="top-right" />
        {/* Main content area grows to fill space */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<RegistrationForm />} />
            <Route path="/admin/register" element={<AdminRegistration />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        {/* Footer is placed outside Routes but inside the main flex container */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
