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
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
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
