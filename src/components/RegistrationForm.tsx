import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Users, Facebook, Instagram, Youtube, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
// import { BackgroundBeamsWithCollision } from "../components/ui/background-beams-with-collision";
import { motion } from "motion/react";
import { ImagesSlider } from "../components/ui/images-slider";
import { format, isSunday, addDays } from "date-fns";

/* Simplified Registration Form for 2026 */
interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "";
  isNewMember: "Yes" | "No";
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
          event: "*", 
          schema: "public",
          table: "registrations",
        },
        () => {
          fetchRegistrationCount();
        }
      )
      .subscribe();

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
        is_new_member: data.isNewMember === "Yes",
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
        if (insertError.message.includes('violates check constraint "registrations_gender_check"')) {
          throw new Error("Invalid gender selected.");
        } else if (insertError.message.includes("duplicate key value violates unique constraint")) {
            toast.error("This email address has already been registered.", {
              id: loadingToastId,
            });
            setIsSubmitting(false);
            return;
        }
        throw insertError;
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
      <ImagesSlider className="h-[50rem] relative w-full mb-0" images={images}>
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-50 flex flex-col justify-center items-center gap-6 w-full px-4"
        >
          <motion.h1 
            className="font-bold font-chillax text-4xl md:text-7xl text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-orange-200 drop-shadow-2xl py-4"
          >
            Nyanya Assembly<br/>
            <span className="text-3xl md:text-6xl text-white/90">Youth Movement</span>
          </motion.h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2 items-stretch w-[90%] md:w-full max-w-4xl mx-auto">
            {/* Total Youths */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               whileHover={{ scale: 1.05 }}
               className="bg-white/5 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border border-white/10 shadow-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <Users className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="text-white/70 font-medium text-lg">Total Youths</span>
              </div>
              <span className="text-4xl md:text-5xl font-bold text-white font-chillax tracking-tight">
                {registrationCount !== null ? registrationCount : "..."}
              </span>
            </motion.div>

             {/* Present */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               whileHover={{ scale: 1.05 }}
               className="bg-green-900/10 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border border-green-500/20 shadow-xl hover:bg-green-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-green-100/70 font-medium text-lg">Present Today</span>
              </div>
              <span className="text-4xl md:text-5xl font-bold text-green-400 font-chillax tracking-tight">
                {attendanceStats.present}
              </span>
            </motion.div>

             {/* Absent */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               whileHover={{ scale: 1.05 }}
               className="bg-red-900/10 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border border-red-500/20 shadow-xl hover:bg-red-900/20 transition-colors"
             >
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <span className="text-red-100/70 font-medium text-lg">Absent Today</span>
              </div>
              <span className="text-4xl md:text-5xl font-bold text-red-400 font-chillax tracking-tight">
                {attendanceStats.absent}
              </span>
            </motion.div>
          </div>

          {/* Social Links */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.6 }}
            className="flex items-center gap-6 mb-4"
          >
            {[
              { Icon: Facebook, href: "https://www.facebook.com/share/1CfaQQBxVB/?mibextid=wwXIfr" },
              { Icon: Instagram, href: "https://www.instagram.com/tacn_na?igsh=dDhxcmplNzVzZDNw" },
              { Icon: Youtube, href: "https://youtube.com/@tacn_na" }
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white p-3 rounded-full bg-white/5 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110 border border-white/5"
              >
                <Icon className="w-6 h-6" />
              </a>
            ))}
          </motion.div>
  
            <Link
              to="/admin/login"
              className="font-chillax px-6 py-2 mb-4 backdrop-blur-md border bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 mx-auto text-center rounded-lg transition-all duration-300 relative group overflow-hidden"
            >
              <span className="relative z-10 font-medium tracking-wide">Admin Access</span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </Link>
          </motion.div>
      </ImagesSlider>
      
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-2xl mx-auto font-chillax">
             {/* Use a wrapper for the form to give it stronger isolation */}
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="bg-black/40 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10 relative overflow-hidden"
            >
                 {/* Decorative background gradients within the card */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Join Us Now</h2>
                <p className="text-white/50">Complete the form below to register.</p>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 relative z-10"
              >
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-white/70 mb-2 text-sm font-medium ml-1">Full Name</label>
                    <input
                      {...register("fullName", {
                        required: "Full name is required",
                      })}
                      className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-light"
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-red-400 text-sm mt-2 ml-1">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>
  
                  <div className="group">
                    <label className="block text-white/70 mb-2 text-sm font-medium ml-1">Email Address</label>
                    <input
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-light"
                      placeholder="Start with your email"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-2 ml-1">{errors.email.message}</p>
                    )}
                  </div>
  
                  <div className="group">
                    <label className="block text-white/70 mb-2 text-sm font-medium ml-1">Phone Number</label>
                    <input
                      type="tel"
                      {...register("phone", {
                        required: "Phone number is required",
                      })}
                      className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-light"
                      placeholder="+233..."
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-2 ml-1">{errors.phone.message}</p>
                    )}
                  </div>
  
                  <div className="group">
                    <label className="block text-white/70 mb-2 text-sm font-medium ml-1">Gender</label>
                    <div className="relative">
                      <select
                        {...register("gender", { required: "Gender is required" })}
                        className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-light appearance-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled className="bg-[#1a1a1a] text-white/50">
                          Select Gender
                        </option>
                        <option value="Male" className="bg-[#1a1a1a]">Male</option>
                        <option value="Female" className="bg-[#1a1a1a]">Female</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    {errors.gender && (
                      <p className="text-red-400 text-sm mt-2 ml-1">{errors.gender.message}</p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-white/70 mb-2 text-sm font-medium ml-1">New Youth Member?</label>
                    <div className="relative">
                      <select
                        {...register("isNewMember", { required: "Please select an option" })}
                        className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-light appearance-none cursor-pointer"
                        defaultValue="No"
                      >
                         <option value="No" className="bg-[#1a1a1a]">No</option>
                         <option value="Yes" className="bg-[#1a1a1a]">Yes</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    {errors.isNewMember && (
                      <p className="text-red-400 text-sm mt-2 ml-1">{errors.isNewMember.message}</p>
                    )}
                  </div>
  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-500 hover:to-orange-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4 transform hover:translate-y-[-2px]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                       {isSubmitting ? "Registering..." : "Complete Registration"}
                       {!isSubmitting && (
                         <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                       )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

const images = [
  "/images/team1.webp",
  "/images/youth_9.jpeg",
  "images/image.avif",
  "images/image_3.jpg",
  "/images/youth_1.jpg",
  "/images/youth_2.jpg",
   "images/image_4.jpg",
  "/images/solo.jpg",
  "/images/youth_3.jpg",
  "/images/youth_4.jpg",
  "/images/youth_10.jpg",
  "/images/youth_5.jpg",
  "/images/youth_6.jpg",
  "/images/youth_7.jpg",
  "/images/youth_8.jpg"
];
