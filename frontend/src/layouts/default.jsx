import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const userStr = params.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Remove query params from URL
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <nav>
        <Navbar searchTerm={searchTerm} onSearch={setSearchTerm} />
      </nav>

      <main className="flex-grow bg-[#F3FBFC]">
        <Outlet context={{ searchTerm }} />
      </main>

      <footer className="py-6 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between px-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#40C9D5] to-[#2BA8B4] rounded-xl flex items-center justify-center shadow-lg shadow-[#40C9D5]/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 12H5L8 20L12 4L15 14L18 10H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-[#344054] tracking-tight leading-none">
              AIOON
            </span>
            <span className="text-[9px] font-bold text-[#AAB4B9] uppercase tracking-[0.2em] mt-1">
              Therapy Analytics
            </span>
          </div>
        </div>
        
        <p className="text-[11px] text-gray-400 font-medium">
          © {new Date().getFullYear()} AIOON Project. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
