import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { register } from "../Functions/auth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Check if passwords match (only show when confirmPassword has value)
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    register({
      username,
      password,
      confirmPassword,
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F8FA] via-[#F3FBFC] to-[#E0F4F7] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#40C9D5]/20 to-transparent rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#40C9D5]/15 to-transparent rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-[#40C9D5]/10 rounded-full blur-2xl"></div>

      {/* Register Card */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-[#40C9D5]/10 p-10 w-full max-w-md border border-white/50">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#40C9D5] to-[#2BA8B4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#40C9D5]/30 mb-4 transform hover:scale-105 transition-transform">
            <div className="w-6 h-6 bg-white rounded-full opacity-90"></div>
          </div>
          <h1 className="text-3xl font-bold text-[#344054] tracking-tight">
            AIOON
          </h1>
          <p className="text-[#7E8C94] text-sm mt-2">สร้างบัญชีใหม่</p>
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

          {/* Confirm Password Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ABB7C2]">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="ยืนยันรหัสผ่าน"
              style={{
                WebkitTextSecurity: showConfirmPassword ? "none" : "disc",
              }}
              className={`w-full pl-12 pr-20 py-4 bg-[#F8F9FA] border rounded-2xl text-[#344054] placeholder-[#ABB7C2] focus:outline-none transition-all text-[15px] font-medium [&::-ms-reveal]:hidden [&::-webkit-textfield-decoration-container]:hidden
                ${
                  passwordsMatch
                    ? "border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                    : ""
                }
                ${
                  passwordsMismatch
                    ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                    : ""
                }
                ${
                  !passwordsMatch && !passwordsMismatch
                    ? "border-gray-100 focus:border-[#40C9D5] focus:ring-2 focus:ring-[#40C9D5]/20"
                    : ""
                }
              `}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {passwordsMatch && (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              )}
              {passwordsMismatch && (
                <XCircleIcon className="w-5 h-5 text-red-500" />
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-[#ABB7C2] hover:text-[#40C9D5] transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Password Match Message */}
          {passwordsMismatch && (
            <p className="text-red-500 text-sm -mt-2 pl-1">รหัสผ่านไม่ตรงกัน</p>
          )}

          {/* Register Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-[#40C9D5] to-[#2BA8B4] text-white font-semibold text-[16px] rounded-2xl shadow-lg shadow-[#40C9D5]/30 hover:shadow-xl hover:shadow-[#40C9D5]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all mt-2"
          >
            สร้างบัญชี
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-[#ABB7C2] text-sm">หรือ</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-[#7E8C94] text-sm">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              to="/login"
              className="text-[#40C9D5] font-semibold hover:text-[#2BA8B4] transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
