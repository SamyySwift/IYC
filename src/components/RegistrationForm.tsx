import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Users, Facebook, Instagram, Youtube, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { BackgroundBeamsWithCollision } from "../components/ui/background-beams-with-collision";
import { motion } from "motion/react";
import { ImagesSlider } from "../components/ui/images-slider";
import { format, isSunday, addDays } from "date-fns";

/* Simplified Registration Form for 2026 */
interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "";
}

// Helper to get nearest Sunday
const getInitialDate = () => {
  const today = new Date();
  if (isSunday(today)) return format(today, "yyyy-MM-dd");
  return format(addDays(today, (7 - today.getDay()) % 7 || 7), "yyyy-MM-dd");
};

export default function RegistrationForm() {
  const [registrationCount, setRegistrationCount] = useState<number | null>(
    null
  );
  const [attendanceStats, setAttendanceStats] = useState<{ present: number; absent: number }>({ present: 0, absent: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>();

  useEffect(() => {
    fetchRegistrationCount();
    fetchAttendanceStats();

    const channel = supabase
      .channel("registration_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events to update stats potentially? Or just keep it simplish
          schema: "public",
          table: "registrations",
        },
        () => {
          fetchRegistrationCount();
        }
      )
      .subscribe();
      
    // Should we listen to attendance too? Probably overkill for public view but good for polish.
    // For now, simple fetch on load.

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchRegistrationCount = async () => {
    try {
      const { data, error } = await supabase
        .rpc("get_registration_count");

      if (error) {
        console.error("Error fetching count:", error);
        return;
      }

      setRegistrationCount(data || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchAttendanceStats = async () => {
    const date = getInitialDate();
    const { data, error } = await supabase
      .from("attendance")
      .select("status")
      .eq("date", date);
      
    if (!error && data) {
       const present = data.filter(d => d.status === 'Present').length;
       const absent = data.filter(d => d.status === 'Absent').length;
       setAttendanceStats({ present, absent });
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Submitting registration...");

    try {
      // 1. Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("registrations")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking email:", checkError);
        throw new Error("Failed to verify email. Please try again.");
      }

      if (existingUser) {
        toast.error("This email address has already been registered.", {
          id: loadingToastId,
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Prepare registration data
      const registrationData = {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        has_paid: false,
        // Optional fields set to null or empty string as permitted by DB
        area: null, 
        expectations: null,
        metropolitan: '',
        district: '',
        assembly: ''
      };

      // 3. Insert new registration
      const { error: insertError } = await supabase
        .from("registrations")
        .insert([registrationData]);

      if (insertError) {
        if (
          insertError.message.includes(
            'violates check constraint "registrations_gender_check"'
          )
        ) {
          throw new Error("Invalid gender selected.");
        } else {
          if (
            insertError.message.includes(
              "duplicate key value violates unique constraint"
            )
          ) {
            toast.error("This email address has already been registered.", {
              id: loadingToastId,
            });
            setIsSubmitting(false);
            return;
          }
          throw insertError;
        }
      }

      toast.success("Registration successful!", { id: loadingToastId });
      reset();
      await fetchRegistrationCount();
    } catch (error: any) {
      console.error("Registration process error:", error);
      toast.error(error.message || "Registration failed. Please try again.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="">
      <ImagesSlider className="h-[40rem] relative w-full mb-20" images={images}>
        <motion.div
          initial={{
            opacity: 0,
            y: -80,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="z-50 flex flex-col justify-center items-center gap-4 w-full px-4"
        >
          <motion.p className="font-bold font-chillax text-4xl md:text-6xl text-center bg-clip-text text-transparent bg-gradient-to-b from-purple-500/80 to-orange-500/60 py-4">
            Nyanya Assembly Youth Registration 2026
          </motion.p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-stretch">
            {/* Total Youths */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 flex flex-col items-center justify-center gap-2 border border-white/10">
              <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-white" />
                  <span className="text-white/80 font-medium">Total Youths</span>
              </div>
              <span className="text-2xl md:text-3xl font-bold text-white font-chillax">
                {registrationCount !== null ? registrationCount : "..."}
              </span>
            </div>

             {/* Present */}
             <div className="bg-green-500/10 backdrop-blur-sm rounded-lg p-5 flex flex-col items-center justify-center gap-2 border border-green-500/20">
              <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-green-100/80 font-medium">Present Today</span>
              </div>
              <span className="text-2xl md:text-3xl font-bold text-green-400 font-chillax">
                {attendanceStats.present}
              </span>
            </div>

             {/* Absent */}
             <div className="bg-red-500/10 backdrop-blur-sm rounded-lg p-5 flex flex-col items-center justify-center gap-2 border border-red-500/20">
              <div className="flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <span className="text-red-100/80 font-medium">Absent Today</span>
              </div>
              <span className="text-2xl md:text-3xl font-bold text-red-400 font-chillax">
                {attendanceStats.absent}
              </span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 mb-4">
            <a
              href="https://www.facebook.com/share/1DiwZL9rRt/?mibextid=qi2Omg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/tjm_tacn?igsh=emw4ZzA0bGh2eGJy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://m.youtube.com/channel/UC6Lo3XIj-c2r1uDH_IlUzWg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
  
            <Link
              to="/admin/login"
              className="font-chillax px-4 py-2 backdrop-blur-sm border bg-purple-500/10 border-purple-500/20 text-white mx-auto text-center rounded-full relative mt-4"
            >
              <span>Admin Panel</span>
              <div className="absolute inset-x-0  h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-orange-500 to-transparent" />
            </Link>
          </motion.div>
        </ImagesSlider>
        <BackgroundBeamsWithCollision>
          <div className="container mx-auto px-4 pb-12">
            <div className="max-w-3xl mx-auto font-chillax">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white/10 backdrop-blur-xl rounded-xl p-8 shadow-xl"
              >
                <div className="space-y-5">
                  <div>
                    <label className="block text-white mb-2">Full Name</label>
                    <input
                      {...register("fullName", {
                        required: "Full name is required",
                      })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {errors.fullName && (
                      <p className="text-red-400 mt-1">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>
  
                  <div>
                    <label className="block text-white mb-2">Email</label>
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
                    <label className="block text-white mb-2">Phone Number</label>
                    <input
                      type="tel"
                      {...register("phone", {
                        required: "Phone number is required",
                      })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {errors.phone && (
                      <p className="text-red-400 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
  
                  {/* Gender Dropdown */}
                  <div>
                    <label className="block text-white mb-2">Gender</label>
                    <select
                      {...register("gender", { required: "Gender is required" })}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-transparent"
                      defaultValue=""
                    >
                      <option value="" disabled className="text-black">
                        Select Gender
                      </option>
                      <option value="Male" className="text-black">Male</option>
                      <option value="Female" className="text-black">Female</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-400 mt-1">{errors.gender.message}</p>
                    )}
                  </div>
  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-500/80 to-orange-500/80 hover:from-purple-500/90 hover:to-orange-500/90 text-white font-semibold py-3 px-5 rounded-lg transition duration-200 relative disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Registering..." : "Register Now"}
                    {!isSubmitting && (
                      <div className="absolute inset-x-0  h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-orange-500 to-transparent" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </BackgroundBeamsWithCollision>
      </div>
    );
  }

const images = [
  "/images/team1.webp",
  "https://images.unsplash.com/photo-1482189349482-3defd547e0e9?q=80&w=2848&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "/images/team3.JPG",
  "/images/team5.JPG",
  "/images/team4.JPG",
];
