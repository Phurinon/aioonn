import React from "react";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function Navbar({ searchTerm, onSearch }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <nav className="w-full bg-white border border-gray-300 shadow-xl px-6 lg:px-12 py-4 flex justify-between items-center">
      {/* ส่วนซ้ายสุด: logo */}
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

      {/* ส่วนตรงกลาง: ค้นหารายชื่อ */}
      <div className="flex items-center rounded-full w-full max-w-[480px] mx-8 px-5 py-3 bg-[#F8F9FA] border border-gray-100 gap-3 focus-within:border-[#40C9D5] focus-within:ring-2 focus-within:ring-[#40C9D5]/20 transition-all">
        <MagnifyingGlassIcon className="w-5 h-5 text-[#ABB7C2]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="ค้นหารายชื่อผู้ป่วย ..."
          className="w-full outline-none text-[#344054] placeholder-[#ABB7C2] bg-transparent text-[15px] font-medium"
        />
      </div>

      {/* ส่วนขวาสุด: ชื่อโรงพยาบาล + menu button */}
      <div className="flex items-center gap-4">
        <span className="text-[#7E8C94] text-[14px] hidden lg:block font-medium">
          {user.displayName}
        </span>
        {/* Vertical Divider */}
        <div className="hidden lg:block w-px h-6 bg-gray-200"></div>
        <Link to="/profile" className="group">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#F3FBFC] hover:bg-[#E8F8FA] cursor-pointer transition-all flex items-center justify-center border border-[#E8F8FA] hover:border-[#40C9D5]">
            <Bars3Icon className="w-6 h-6 text-[#40C9D5] group-hover:text-[#2BA8B4] transition-colors" />
          </div>
        </Link>
      </div>
    </nav>
  );
}
