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
    <div className="relative min-h-screen bg-[#0A0A0A] selection:bg-purple-500/30 overflow-x-hidden">
      <div className="noise-overlay" />
      
      <ImagesSlider className="h-screen relative w-full mb-0" images={images}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="z-50 flex flex-col justify-center items-center gap-12 w-full px-4"
        >
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
            >
              <h2 className="text-purple-400 font-medium tracking-[0.2em] uppercase text-sm mb-4">
                Since 2026
              </h2>
            </motion.div>
            
            <motion.h1 
              className="font-bold font-syne text-5xl md:text-9xl text-center leading-[0.9] tracking-tighter text-white"
            >
              <motion.span 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.215, 0.61, 0.355, 1] }}
                className="block"
              >
                Nyanya
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
                className="block bg-gradient-to-r from-purple-400 via-orange-300 to-purple-400 bg-clip-text text-transparent"
              >
                Youths
              </motion.span>
            </motion.h1>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch w-full max-w-5xl mx-auto px-4">
            {[
              { label: "Total Youths", value: registrationCount, icon: Users, color: "purple" },
              { label: "Present Today", value: attendanceStats.present, icon: CheckCircle, color: "green" },
              { label: "Absent Today", value: attendanceStats.absent, icon: XCircle, color: "red" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + (i * 0.1), duration: 0.5 }}
                whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
                    {stat.label}
                  </span>
                  <span className="text-4xl md:text-5xl font-bold text-white font-syne tracking-tighter">
                    {stat.value !== null ? stat.value : "..."}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {[
                { Icon: Facebook, href: "https://www.facebook.com/share/1CfaQQBxVB/?mibextid=wwXIfr" },
                { Icon: Instagram, href: "https://www.instagram.com/tacn_na?igsh=dDhxcmplNzVzZDNw" },
                { Icon: Youtube, href: "https://youtube.com/@tacn_na" }
              ].map(({ Icon, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white/40 hover:text-white p-4 rounded-full glass border border-white/5 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>

            <Link
              to="/admin/login"
              className="font-syne px-8 py-3 glass border border-white/10 text-white/60 hover:text-white hover:border-white/30 rounded-full transition-all duration-500 uppercase tracking-widest text-[10px] font-bold"
            >
              Admin Gateway
            </Link>
          </motion.div>
        </motion.div>
      </ImagesSlider>
      
      <div className="relative py-32 bg-[#0A0A0A]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.215, 0.61, 0.355, 1] }}
              className="glass rounded-[2rem] p-8 md:p-16 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

              <div className="text-center mb-16 relative">
                <motion.span 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-purple-400 text-xs font-bold uppercase tracking-[0.3em] mb-4 block"
                >
                  Registration
                </motion.span>
                <h2 className="text-4xl md:text-5xl font-bold text-white font-syne tracking-tighter">
                  Start Your Journey
                </h2>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-8 relative z-10"
              >
                <div className="space-y-8">
                  {[
                    { id: "fullName", label: "Full Name", placeholder: "Your name", type: "text" },
                    { id: "email", label: "Email Address", placeholder: "Email address", type: "email" },
                    { id: "phone", label: "Phone Number", placeholder: "+234...", type: "tel" }
                  ].map((field, i) => (
                    <motion.div 
                      key={field.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="group relative"
                    >
                      <label className="block text-white/30 mb-3 text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors group-focus-within:text-purple-400">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        {...register(field.id as any, { 
                          required: `${field.label} is required`,
                          ...(field.id === "email" ? { pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } } : {})
                        })}
                        className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white placeholder-white/10 focus:outline-none focus:border-purple-500 transition-all font-light text-lg"
                        placeholder={field.placeholder}
                      />
                      {(errors as any)[field.id] && (
                        <p className="text-red-400 text-[10px] uppercase font-bold tracking-wider mt-2 ml-1">
                          {(errors as any)[field.id].message}
                        </p>
                      )}
                    </motion.div>
                  ))}
   
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="group"
                    >
                      <label className="block text-white/30 mb-3 text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors group-focus-within:text-purple-400">Gender</label>
                      <select
                        {...register("gender", { required: "Gender is required" })}
                        className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-purple-500 transition-all font-light text-lg appearance-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled className="bg-[#0A0A0A] text-white/20">Select Gender</option>
                        <option value="Male" className="bg-[#0A0A0A]">Male</option>
                        <option value="Female" className="bg-[#0A0A0A]">Female</option>
                      </select>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 }}
                      className="group"
                    >
                      <label className="block text-white/30 mb-3 text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors group-focus-within:text-purple-400">New Member?</label>
                      <select
                        {...register("isNewMember", { required: "Please select an option" })}
                        className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-purple-500 transition-all font-light text-lg appearance-none cursor-pointer"
                        defaultValue="No"
                      >
                        <option value="No" className="bg-[#0A0A0A]">No</option>
                        <option value="Yes" className="bg-[#0A0A0A]">Yes</option>
                      </select>
                    </motion.div>
                  </div>
   
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group relative h-16 bg-white text-black font-bold uppercase tracking-[0.2em] text-xs rounded-full transition-all duration-300 hover:bg-purple-500 hover:text-white disabled:opacity-50 mt-8 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                       {isSubmitting ? "Processing..." : "Submit Registration"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.button>
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
  "/images/youth_1.png",
  "/images/youth_2.png",
   "images/image_4.jpg",
  "/images/solo.png",
   "/images/youth_12.png",
  "/images/youth_3.png",
  "/images/youth_4.png",
  "/images/youth_5.png",
  "/images/youth_6.png",
  "/images/youth_7.png",
  "/images/youth_8.jpg",
   "/images/youth_11.jpeg"
];
