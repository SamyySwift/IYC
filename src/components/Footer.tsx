import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-6 border-t border-t-gray-700/50 mt-0">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 font-chillax">
          <div className="text-white/60 text-xs md:text-sm">
            The Apostolic Church Nigeria, FCT Field.
          </div>
          <div className="text-white/60 text-xs md:text-sm text-center">
            © 2025 International Youth Conference. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/share/1DiwZL9rRt/?mibextid=qi2Omg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href=""
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
        </div>
      </div>
    </footer>
  );
}
