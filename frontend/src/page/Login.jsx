import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { login } from "../Functions/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({
        username,
        password,
      });

      // Assuming response.data contains { token, user } or similar
      // Adjust based on your actual API response structure
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("token", response.data.token); // If token is used
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F8FA] via-[#F3FBFC] to-[#E0F4F7] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#40C9D5]/20 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-[#40C9D5]/15 to-transparent rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-[#40C9D5]/10 rounded-full blur-2xl"></div>

      {/* Login Card */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-[#40C9D5]/10 p-10 w-full max-w-md border border-white/50">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#40C9D5] to-[#2BA8B4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#40C9D5]/30 mb-4 transform hover:scale-105 transition-transform">
            <div className="w-6 h-6 bg-white rounded-full opacity-90"></div>
          </div>
          <h1 className="text-3xl font-bold text-[#344054] tracking-tight">
            AIOON
          </h1>
          <p className="text-[#7E8C94] text-sm mt-2">ยินดีต้อนรับกลับมา</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ABB7C2]">
              <UserIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ชื่อผู้ใช้"
              className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-gray-100 rounded-2xl text-[#344054] placeholder-[#ABB7C2] focus:outline-none focus:border-[#40C9D5] focus:ring-2 focus:ring-[#40C9D5]/20 transition-all text-[15px] font-medium"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ABB7C2]">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              className="w-full pl-12 pr-12 py-4 bg-[#F8F9FA] border border-gray-100 rounded-2xl text-[#344054] placeholder-[#ABB7C2] focus:outline-none focus:border-[#40C9D5] focus:ring-2 focus:ring-[#40C9D5]/20 transition-all text-[15px] font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ABB7C2] hover:text-[#40C9D5] transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-[#40C9D5] to-[#2BA8B4] text-white font-semibold text-[16px] rounded-2xl shadow-lg shadow-[#40C9D5]/30 hover:shadow-xl hover:shadow-[#40C9D5]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-[#ABB7C2] text-sm">หรือ</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google Login Button */}
        <a
          href={`${import.meta.env.VITE_API_URL}/auth/google`}
          className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-gray-200 rounded-2xl text-[#344054] font-medium hover:bg-gray-50 transition-all mb-6"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          เข้าสู่ระบบด้วย Google
        </a>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-[#7E8C94] text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link
              to="/register"
              className="text-[#40C9D5] font-semibold hover:text-[#2BA8B4] transition-colors"
            >
              สร้างบัญชีใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
