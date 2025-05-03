import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Users, Facebook, Instagram, Twitter } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { BackgroundBeamsWithCollision } from "../components/ui/background-beams-with-collision";
import { motion } from "motion/react";
import { ImagesSlider } from "../components/ui/images-slider";

interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | ""; // Added gender field
  shirt_size: string; // Add shirt size field
  metropolitan: string;
  area: string;
  district: string;
  assembly: string;
  goals: string;
}

export default function RegistrationForm() {
  const [registrationCount, setRegistrationCount] = useState<number | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>();

  useEffect(() => {
    fetchRegistrationCount();

    // Subscribe to INSERT changes in the registrations table
    const channel = supabase
      .channel("registration_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
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
      const { count, error } = await supabase
        .from("registrations")
        .select("*", { count: "exact" });

      if (error) {
        console.error("Error fetching count:", error);
        return;
      }

      setRegistrationCount(count || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Submitting registration..."); // Show loading toast

    try {
      // 1. Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("registrations")
        .select("id")
        .eq("email", data.email)
        .maybeSingle(); // Use maybeSingle to get one or null

      if (checkError) {
        console.error("Error checking email:", checkError);
        throw new Error("Failed to verify email. Please try again.");
      }

      if (existingUser) {
        toast.error("This email address has already been registered.", {
          id: loadingToastId,
        });
        setIsSubmitting(false);
        return; // Stop submission
      }

      // 2. Prepare registration data (if email doesn't exist)
      const registrationData = {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        metropolitan: data.metropolitan,
        area: data.area,
        district: data.district,
        assembly: data.assembly,
        gender: data.gender,
        shirt_size: data.shirt_size, // Add shirt size
        goals: data.goals,
        has_paid: false,
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
          // Handle potential race condition where email was inserted between check and insert
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
          throw insertError; // Throw other insert errors
        }
      }

      // 4. Send data to Make webhook (only if insert was successful)
      try {
        await fetch(
          "https://hook.eu2.make.com/kuoqxruqexb195ll1umjxdeh2dtferla",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(registrationData),
          }
        );
      } catch (webhookError) {
        console.error("Make webhook error:", webhookError);
        // Decide if you want to inform the user or just log it
        // toast.error("Registration saved, but failed to notify system.", { id: loadingToastId });
        // Don't throw here, registration was successful
      }

      toast.success("Registration successful!", { id: loadingToastId });
      reset();
      await fetchRegistrationCount(); // Refresh count
    } catch (error: any) {
      console.error("Registration process error:", error);
      toast.error(error.message || "Registration failed. Please try again.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false); // Re-enable button regardless of outcome
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
          className="z-50 flex flex-col justify-center items-center gap-4"
        >
          <motion.p className="font-bold font-chillax text-4xl md:text-6xl text-center bg-clip-text text-transparent bg-gradient-to-b from-purple-500/80 to-orange-500/60 py-4">
            International Youth Conference Registration 2025
          </motion.p>
          {/* Registration Count */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 inline-block mb-4">
            <div className="flex items-center justify-center gap-3">
              <Users className="w-8 h-8 text-white" />
              <span className="text-xl md:text-3xl font-semibold text-white font-chillax">
                {registrationCount !== null
                  ? `${registrationCount} Registrations`
                  : "Loading..."}
              </span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 mb-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Twitter className="w-5 h-5" />
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
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    defaultValue="" // Add a default empty value
                  >
                    <option value="" disabled>
                      Select Gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-400 mt-1">{errors.gender.message}</p>
                  )}
                </div>

                {/* Shirt Size Dropdown */}
                <div>
                  <label className="block text-white mb-2">Shirt Size</label>
                  <select
                    {...register("shirt_size", {
                      required: "Shirt size is required",
                    })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                    defaultValue="" // Add a default empty value
                  >
                    <option value="" disabled>
                      Select Shirt Size
                    </option>
                    <option value="Small">Small(S)</option>
                    <option value="Medium">Medium(M)</option>
                    <option value="Large">Large(L)</option>
                    <option value="Extra Large">Extra Large(XL)</option>
                    <option value="Double Extra Large">
                      Double Extra Large(2XL)
                    </option>
                    <option value="Triple Extra Large">
                      Triple Extra Large(3XL)
                    </option>
                    <option value="Quadruple Extra Large">
                      Quadruple Extra Large(4XL)
                    </option>
                  </select>
                  {errors.shirt_size && (
                    <p className="text-red-400 mt-1">
                      {errors.shirt_size.message}
                    </p>
                  )}
                </div>
                {/* End Gender Dropdown */}

                <div>
                  <label className="block text-white mb-2">Metropolitan</label>
                  <input
                    {...register("metropolitan", {
                      required: "Metropolitan is required",
                    })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.metropolitan && (
                    <p className="text-red-400 mt-1">
                      {errors.metropolitan.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white mb-2">Area</label>
                  <input
                    {...register("area", { required: "Area is required" })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.area && (
                    <p className="text-red-400 mt-1">{errors.area.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white mb-2">District</label>
                  <input
                    {...register("district", {
                      required: "District is required",
                    })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.district && (
                    <p className="text-red-400 mt-1">
                      {errors.district.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white mb-2">Assembly</label>
                  <input
                    {...register("assembly", {
                      required: "Assembly is required",
                    })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.assembly && (
                    <p className="text-red-400 mt-1">
                      {errors.assembly.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white mb-2">
                    What are your expectations from IYC 2025?
                  </label>
                  <textarea
                    {...register("goals", {
                      required: "This field is required",
                    })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {errors.goals && (
                    <p className="text-red-400 mt-1">{errors.goals.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting} // Disable button while submitting
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
