import { Facebook, Instagram, Youtube, GlobeLock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-20 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 font-inter">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="glass p-2 rounded-full border border-white/10 group overflow-hidden">
                <img 
                src="/images/logo.jpeg" 
                alt="TACN Logo" 
                className="w-16 h-16 rounded-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                />
            </div>
            <div>
                <h4 className="text-white text-lg font-bold font-syne tracking-tighter mb-1">
                    Nyanya Assembly <span className="text-purple-400">Youths</span>
                </h4>
                <p className="text-white/20 text-[10px] uppercase font-bold tracking-[0.2em]">
                    The Apostolic Church Nigeria
                </p>
            </div>
          </div>

          <div className="max-w-md text-center">
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2 italic">Vision Protocol</p>
             <p className="text-white/60 text-sm font-light leading-relaxed">
              "To raise a united, vibrant, and spiritually <br className="hidden md:block"/> grounded generation."
            </p>
          </div>

          <div className="flex items-center gap-3">
            {[
              { icon: Facebook, href: "https://www.facebook.com/share/1CfaQQBxVB/?mibextid=wwXIfr" },
              { icon: Instagram, href: "https://www.instagram.com/tacn_na?igsh=dDhxcmplNzVzZDNw" },
              { icon: Youtube, href: "https://youtube.com/@tacn_na" },
              { icon: GlobeLock, href: "https://www.tacnyanyaassembly.org/" }
            ].map((social, i) => (
              <a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-4 rounded-full border border-white/5 hover:bg-white hover:text-black transition-all duration-500 hover:-translate-y-2"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/10 text-[10px] uppercase font-bold tracking-[0.3em]">
                &copy; {new Date().getFullYear()} Digital Experience
            </p>
            <div className="flex gap-8">
                <span className="text-white/10 text-[10px] uppercase font-bold tracking-[0.3em] hover:text-white/40 cursor-pointer transition-colors">Privacy</span>
                <span className="text-white/10 text-[10px] uppercase font-bold tracking-[0.3em] hover:text-white/40 cursor-pointer transition-colors">Terms</span>
            </div>
        </div>
      </div>
    </footer>
  );
}
