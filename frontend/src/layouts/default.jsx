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

      {/* ล่าง: Footer */}
      <footer className="h-16 bg-gray-100 flex items-center justify-center text-gray-500">
        Footer content
      </footer>
    </div>
  );
};

export default Layout;
