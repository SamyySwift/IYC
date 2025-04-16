import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

interface RegistrationFormData {
  email: string;
  password: string;
  registrationCode: string;
}

// IYC2025-ADMIN

export default function AdminRegistration() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>();

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      toast.success("Admin registration successful! Please log in.");
      navigate("/admin/login");
    } catch (error) {
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-chillax">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-white">
            Admin Registration
          </h2>
          <p className="mt-2 text-center text-white/60">
            Register as an administrator with your registration code
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
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.password && (
                <p className="text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="text-white">Registration Code</label>
              <input
                type="password"
                {...register("registrationCode", {
                  required: "Registration code is required",
                })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.registrationCode && (
                <p className="text-red-400 mt-1">
                  {errors.registrationCode.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Register as Admin
          </button>

          <div className="text-center">
            <a
              href="/admin/login"
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              Already registered? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
