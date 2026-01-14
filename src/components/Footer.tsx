import { Facebook, Instagram, Youtube, GlobeLock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-6 border-t border-t-gray-700/50 mt-0">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 font-chillax">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo.jpeg" 
              alt="TACN Logo" 
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            <div className="text-white/60 text-xs md:text-sm">
              The Apostolic Church Nigeria, Nyanya Youths.
            </div>
          </div>
          <div className="text-white/60 text-xs md:text-sm text-center">
            <span className="font-semibold">Vision:</span> To raise a united, vibrant, and spiritually grounded youths.
            </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a
              href="https://www.facebook.com/share/1CfaQQBxVB/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/tacn_na?igsh=dDhxcmplNzVzZDNw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://youtube.com/@tacn_na"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Youtube className="w-5 h-5" />
            </a>
            <a
              href="https://www.tacnyanyaassembly.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <GlobeLock className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
