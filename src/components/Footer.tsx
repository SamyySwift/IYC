export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0D0B14] text-gray-400 py-6  border-t border-gray-700/50 text-sm">
      <div className="container mx-auto px-4 text-center">
        <div className="">
          {/* Placeholder for logo if added later */}
          <span className="font-semibold text-gray-300">
            The Apostolic Church, Nigeria, FCT Field Abuja
          </span>
        </div>
        <div className="mb-4">
          &copy; {currentYear} The Apostolic Church, Nigeria, FCT Field. All
          rights reserved.
        </div>
        <div>
          Designed by{" "}
          <a
            href="https://github.com/samswift" // Assuming a GitHub link, adjust if needed
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300"
          >
            SamSwift
          </a>
        </div>
      </div>
    </footer>
  );
}
