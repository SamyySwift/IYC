import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

interface RegistrationFormData {
  email: string;
  password: string;
  registrationCode: string;
}

export default function AdminRegistration() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegistrationCode, setShowRegistrationCode] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>();

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      if (data.registrationCode !== "ADMIN") {
        throw new Error("Invalid registration code");
      }

      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Registration failed. Please try again.");
      }

      // 2. Claim admin access via RPC
      const { error: rpcError } = await supabase.rpc("claim_admin_access", {
        access_code: data.registrationCode,
        user_email: data.email,
      });

      if (rpcError) {
        // If RPC fails (e.g. somehow invalid code passed server check, or DB issue), should we cleanup the auth user?
        // For simplicity, we'll just throw. The user exists but won't be an admin.
        throw new Error("Failed to verify admin privileges: " + rpcError.message);
      }

      toast.success("Admin registration successful! Please log in.");
      navigate("/admin/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
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

      <div className="relative z-10 w-full max-w-md px-4 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold font-syne tracking-tighter text-white mb-2">
              Account <span className="text-orange-400">Creation</span>
            </h2>
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-12">
              New Administrator Enrollment
            </p>

            <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <label className="block text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] mb-3 ml-1">Email Coordinates</label>
                  <div className="relative group/input">
                    <input
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-white/10 focus:outline-none focus:border-orange-500/50 focus:bg-white/5 transition-all duration-500 font-light text-sm group-hover/input:bg-white/[0.05] group-hover/input:border-white/10"
                      placeholder="admin@access.io"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-orange-500/0 group-hover/input:bg-orange-500/2 transition-all duration-500 pointer-events-none" />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-[10px] uppercase font-bold tracking-widest mt-2 ml-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] mb-3 ml-1">PASSWORD</label>
                  <div className="relative group/input">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters",
                        },
                      })}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-white/10 focus:outline-none focus:border-orange-500/50 focus:bg-white/5 transition-all duration-500 font-light text-sm group-hover/input:bg-white/[0.05] group-hover/input:border-white/10 pr-14"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/10 transition-all duration-300 z-20"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute inset-0 rounded-2xl bg-orange-500/0 group-hover/input:bg-orange-500/2 transition-all duration-500 pointer-events-none" />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-[10px] uppercase font-bold tracking-widest mt-2 ml-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] mb-3 ml-1">Activation CODE</label>
                  <div className="relative group/input">
                    <input
                      type={showRegistrationCode ? "text" : "password"}
                      {...register("registrationCode", {
                        required: "Registration code is required",
                      })}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-white/10 focus:outline-none focus:border-orange-500/50 focus:bg-white/5 transition-all duration-500 font-light text-sm group-hover/input:bg-white/[0.05] group-hover/input:border-white/10 pr-14"
                      placeholder="Enter Protocol"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegistrationCode(!showRegistrationCode)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/10 transition-all duration-300 z-20"
                    >
                      {showRegistrationCode ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute inset-0 rounded-2xl bg-orange-500/0 group-hover/input:bg-orange-500/2 transition-all duration-500 pointer-events-none" />
                  </div>
                  {errors.registrationCode && (
                    <p className="text-red-400 text-[10px] uppercase font-bold tracking-widest mt-2 ml-1">
                      {errors.registrationCode.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full group relative overflow-hidden bg-white text-black font-bold py-4 px-6 rounded-full transition-all duration-300 shadow-xl mt-4 text-xs uppercase tracking-[0.2em] hover:bg-orange-500 hover:text-white"
              >
                 <span className="relative z-10">CREATE ACCOUNT</span>
              </button>

              <div className="text-center mt-8">
                <Link
                  to="/admin/login"
                  className="text-white/20 hover:text-orange-400 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Authorized? <span className="text-white hover:underline">Return to Portal</span>
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
