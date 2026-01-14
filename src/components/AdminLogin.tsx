import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
// import { BackgroundBeamsWithCollision } from "./ui/background-beams-with-collision";
import { ChevronLeft } from "lucide-react";

interface LoginFormData {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/admin/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/admin/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      // First attempt to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      // Then check if the user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("email", data.email)
        .single();

      if (adminError || !adminData) {
        // If not an admin, sign them out and show error
        await supabase.auth.signOut();
        throw new Error("Not authorized as admin");
      }

      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(
        error.message || "Login failed. Please check your credentials."
      );
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-chillax">
      <div className="absolute top-8 left-8 z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-black/40 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
           {/* Decorative background gradients */}
           <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-center text-3xl font-bold text-white mb-2">
              Admin Login
            </h2>
            <p className="text-center text-white/50 mb-8">
              Sign in to access the dashboard
            </p>
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-white/70 mb-2 text-sm font-medium ml-1">Email</label>
                  <input
                    type="email"
                    {...register("email", { required: "Email is required" })}
                    className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-light"
                    placeholder="admin@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-2 ml-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-white/70 mb-2 text-sm font-medium ml-1">Password</label>
                  <input
                    type="password"
                    {...register("password", { required: "Password is required" })}
                    className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-light"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-2 ml-1">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-500 hover:to-orange-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/20 mt-2 transform hover:translate-y-[-2px]"
              >
                 <span className="relative z-10 flex items-center justify-center gap-2">
                    Sign In
                 </span>
                 <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </button>

              <div className="text-center mt-6">
                <Link
                  to="/admin/register"
                  className="text-white/40 hover:text-white/80 text-sm transition-colors"
                >
                  Need an account? <span className="text-purple-400 hover:text-purple-300">Sign up</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
