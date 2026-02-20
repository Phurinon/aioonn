import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function ActivityLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { pathname } = location;

  const handleBack = () => {
    // If we are on Routine List, go back to Category Select
    if (pathname.includes('/routine/list')) {
      const patientIdMatch = pathname.match(/\/activity\/([^/]+)\//);
      if (patientIdMatch) {
        navigate(`/select-category/${patientIdMatch[1]}`);
        return;
      }
    }

    // Otherwise use normal back
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3FBFC]">
      {/* Navbar with back button */}
      <nav className="w-full bg-white border border-gray-300 shadow-sm px-6 lg:px-12 py-4 flex justify-between items-center">
        {/* ปุ่มย้อนกลับ */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 border border-[#40C9D5] text-[#40C9D5] rounded-lg hover:bg-[#40C9D5] hover:text-white transition-all font-medium"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          ย้อนกลับ
        </button>

        {/* Logo กลาง */}
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-[#40C9D5] to-[#2BA8B4] rounded-full flex items-center justify-center shadow-md">
            <div className="w-4 h-4 bg-white rounded-full opacity-80"></div>
          </div>
          <span className="font-bold text-2xl text-[#344054] tracking-tight">
            AIOON
          </span>
        </Link>

        {/* ชื่อผู้ป่วย + ปุ่มออก */}
        <div className="flex items-center gap-5">
          <span className="text-[#7E8C94] text-[14px] hidden lg:block font-medium">
            {user.displayName}
          </span>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 border border-[#F97066] text-[#F97066] rounded-lg hover:bg-[#F97066] hover:text-white transition-all font-medium"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            ออก (EXIT)
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}
