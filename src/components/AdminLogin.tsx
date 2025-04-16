import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

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
    <div className="min-h-screen flex items-center justify-center px-4 font-chillax">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-white/60">
            Sign in to access the admin dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="text-white">Email</label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.email && (
                <p className="text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-white">Password</label>
              <input
                type="password"
                {...register("password", { required: "Password is required" })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.password && (
                <p className="text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Sign In
          </button>

          <div className="text-center">
            <a
              href="/admin/register"
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              Need to register? Sign up as admin
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
