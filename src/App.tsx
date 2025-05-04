import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import RegistrationForm from "./components/RegistrationForm";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminRegistration from "./components/AdminRegistration";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer"; // Import the Footer component

function App() {
  return (
    <BrowserRouter>
      {/* Use flex column layout to push footer down */}
      <div className="flex flex-col bg-[#0D0B14] relative overflow-hidden">
        <div className="absolute top-96 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-96 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-52 left-72 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
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
