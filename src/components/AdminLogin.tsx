import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";

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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-inter text-white relative">
      <div className="noise-overlay" />
      
      <div className="absolute top-8 left-8 z-50">
        <Link 
          to="/" 
          className="group flex items-center gap-3 glass px-6 py-3 rounded-full hover:bg-white/10 transition-all border border-white/5"
        >
          <ChevronLeft className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Departure</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold font-syne tracking-tighter text-white mb-2">
              Access <span className="text-purple-400">Portal</span>
            </h2>
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-12">
              Administrative Control Unit
            </p>
            
            <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <label className="block text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] mb-3 ml-1">Email Coordinates</label>
                  <div className="relative group/input">
                    <input
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all duration-500 font-light text-sm group-hover/input:bg-white/[0.05] group-hover/input:border-white/10"
                      placeholder="admin@access.io"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-purple-500/0 group-hover/input:bg-purple-500/2 transition-all duration-500 pointer-events-none" />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-[10px] uppercase font-bold tracking-widest mt-2 ml-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] mb-3 ml-1">PASSWORD</label>
                  <div className="relative group/input">
                    <input
                      type="password"
                      {...register("password", { required: "Password is required" })}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all duration-500 font-light text-sm group-hover/input:bg-white/[0.05] group-hover/input:border-white/10"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-purple-500/0 group-hover/input:bg-purple-500/2 transition-all duration-500 pointer-events-none" />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-[10px] uppercase font-bold tracking-widest mt-2 ml-1">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full group relative overflow-hidden bg-white text-black font-bold py-4 px-6 rounded-full transition-all duration-300 shadow-xl mt-4 text-xs uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-white"
              >
                 <span className="relative z-10">AUTHORISE ACCESS</span>
              </button>

              <div className="text-center mt-8">
                <Link
                  to="/admin/register"
                  className="text-white/20 hover:text-purple-400 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Unregistered? <span className="text-white hover:underline">Apply Here</span>
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
