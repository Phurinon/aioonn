import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  CameraIcon,
  PencilIcon,
  ArrowRightOnRectangleIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { updateUser } from "../Functions/user";

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State สำหรับข้อมูลผู้ใช้ (ตอนนี้ใช้ค่าเริ่มต้น ภายหลังจะดึงจาก database)
  // State สำหรับข้อมูลผู้ใช้
  const [profileImage, setProfileImage] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [displayName, setDisplayName] = useState(user.displayName || "User");
  const [username] = useState(user.username || "User"); // Assuming username is immutable for now
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  // console.log(user);

  // State สำหรับ Modal เปลี่ยนรหัสผ่าน
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1 = ยืนยันตัวตน, 2 = ตั้งรหัสใหม่
  const [verifyUsername, setVerifyUsername] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // State สำหรับ Modal ยืนยันออกจากระบบ
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Handle เปลี่ยนรูปโปรไฟล์
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle บันทึกชื่อ
  const handleSaveName = () => {
    setDisplayName(tempName);
    setIsEditingName(false);
    updateUser(user.id, { displayName: tempName });
    localStorage.setItem(
      "user",
      JSON.stringify({ ...user, displayName: tempName })
    );
  };

  //   // Handle ยกเลิกแก้ไขชื่อ
  const handleCancelEdit = () => {
    setTempName(displayName);
    setIsEditingName(false);
  };

  // Handle เปิด Modal ยืนยันออกจากระบบ
  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  // Handle ปิด Modal ยืนยันออกจากระบบ
  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  // Handle Logout
  const handleLogout = () => {
    // TODO: เพิ่ม logic ล้าง session ภายหลัง
    setIsLogoutModalOpen(false);
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate("/login");
  };

  // Handle เปิด Modal เปลี่ยนรหัสผ่าน
  const openPasswordModal = () => {
    setIsPasswordModalOpen(true);
    setPasswordStep(1);
    setVerifyUsername("");
    setVerifyPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  // Handle ปิด Modal เปลี่ยนรหัสผ่าน
  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordStep(1);
    setVerifyUsername("");
    setVerifyPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowVerifyPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  // Handle ยืนยันตัวตน (Step 1)
  const handleVerifyIdentity = () => {
    // TODO: ตรวจสอบ username และ password กับ database ภายหลัง
    // ตอนนี้กดยืนยันได้เลย
    setPasswordStep(2);
  };

  // Handle เปลี่ยนรหัสผ่าน (Step 2)
  const handleChangePassword = () => {
    // TODO: บันทึกรหัสผ่านใหม่ลง database ภายหลัง
    // ตอนนี้กดยืนยันแล้วปิด modal ได้เลย
    closePasswordModal();
  };

  // ตรวจสอบว่ารหัสผ่านใหม่ตรงกัน
  const passwordsMatch =
    confirmNewPassword.length > 0 && newPassword === confirmNewPassword;
  const passwordsMismatch =
    confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F8FA] via-[#F3FBFC] to-[#E0F4F7] flex items-center justify-center p-6">
      {/* Profile Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-[#40C9D5]/10 p-10 w-full max-w-lg border border-white/50">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#344054]">โปรไฟล์ของคุณ</h1>
          <p className="text-[#7E8C94] text-sm mt-2">
            จัดการข้อมูลส่วนตัวของคุณ
          </p>
        </div>

        {/* Profile Image Section */}
        {/* <div className="flex flex-col items-center mb-8">
          <div className="relative group"> */}
        {/* Profile Image Container */}
        {/* <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-[#40C9D5]/30 ring-offset-4 bg-[#F3FBFC] flex items-center justify-center">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-24 h-24 text-[#40C9D5]" />
              )}
            </div>

            {/* Camera Button Overlay */}
        {/* <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-10 h-10 bg-gradient-to-r from-[#40C9D5] to-[#2BA8B4] rounded-full flex items-center justify-center shadow-lg shadow-[#40C9D5]/30 hover:shadow-xl hover:scale-105 transition-all"
            >
              <CameraIcon className="w-5 h-5 text-white" />
            </button> */}

        {/* Hidden File Input */}
        {/* <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <p className="text-[#7E8C94] text-sm mt-4">
            คลิกที่ไอคอนกล้องเพื่อเปลี่ยนรูปโปรไฟล์
          </p>
        </div> */}

        {/* Divider */}
        <div className="h-px bg-gray-200 mb-6"></div>

        {/* Name Section */}
        <div className="mb-6">
          <label className="block text-[#7E8C94] text-sm font-medium mb-2">
            ชื่อที่แสดง
          </label>
          {isEditingName ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#F8F9FA] border border-gray-100 rounded-xl text-[#344054] placeholder-[#ABB7C2] focus:outline-none focus:border-[#40C9D5] focus:ring-2 focus:ring-[#40C9D5]/20 transition-all text-[15px] font-medium"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-xl flex items-center justify-center text-white transition-colors"
              >
                <CheckIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="w-10 h-10 bg-gray-400 hover:bg-gray-500 rounded-xl flex items-center justify-center text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 bg-[#F8F9FA] border border-gray-100 rounded-xl">
              <span className="text-[#344054] text-[15px] font-medium">
                {displayName}
              </span>
              <button
                onClick={() => {
                  setTempName(displayName);
                  setIsEditingName(true);
                }}
                className="text-[#40C9D5] hover:text-[#2BA8B4] transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Username Section (Read-only) */}
        <div className="mb-6">
          <label className="block text-[#7E8C94] text-sm font-medium mb-2">
            ชื่อผู้ใช้
          </label>
          <div className="px-4 py-3 bg-[#F8F9FA] border border-gray-100 rounded-xl">
            <span className="text-[#7E8C94] text-[15px]">@{username}</span>
          </div>
          <p className="text-[#ABB7C2] text-xs mt-1">
            ชื่อผู้ใช้ไม่สามารถเปลี่ยนแปลงได้
          </p>
        </div>

        {/* Back to Home Button */}
        <button
          onClick={() => navigate("/")}
          className="w-full py-4 mb-4 bg-gradient-to-r from-[#40C9D5] to-[#2BA8B4] text-white font-semibold text-[16px] rounded-2xl shadow-lg shadow-[#40C9D5]/30 hover:shadow-xl hover:shadow-[#40C9D5]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          ← กลับหน้าหลัก
        </button>

        {/* Logout Button */}
        <button
          onClick={openLogoutModal}
          className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-[16px] rounded-2xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          ออกจากระบบ
        </button>

        {/* Change Password Link */}
        <div className="text-center mt-6">
          <button
            onClick={openPasswordModal}
            className="text-[#40C9D5] font-medium hover:text-[#2BA8B4] transition-colors text-sm"
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-[#40C9D5] to-[#2BA8B4] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#344054]">
                {passwordStep === 1 ? "ยืนยันตัวตน" : "ตั้งรหัสผ่านใหม่"}
              </h2>
              <p className="text-[#7E8C94] text-sm mt-2">
                {passwordStep === 1
                  ? "กรุณากรอกข้อมูลเพื่อยืนยันตัวตน"
                  : "กรุณากรอกรหัสผ่านใหม่ของคุณ"}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  passwordStep >= 1
                    ? "bg-[#40C9D5] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {passwordStep > 1 ? <CheckIcon className="w-4 h-4" /> : "1"}
              </div>
              <div
                className={`w-12 h-1 rounded-full transition-all ${
                  passwordStep >= 2 ? "bg-[#40C9D5]" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  passwordStep >= 2
                    ? "bg-[#40C9D5] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
            </div>

            {/* Step 1: Verify Identity */}
            {passwordStep === 1 && (
              <div className="space-y-4">
                {/* Username Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ABB7C2]">
                    <UserCircleIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={verifyUsername}
                    onChange={(e) => setVerifyUsername(e.target.value)}
                    placeholder="ไอดีผู้ใช้"
                    className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-gray-100 rounded-xl text-[#344054] placeholder-[#ABB7C2] focus:outline-none focus:border-[#40C9D5] focus:ring-2 focus:ring-[#40C9D5]/20 transition-all text-[15px] font-medium"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <input
                    type={showVerifyPassword ? "text" : "password"}
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    placeholder="รหัสผ่านปัจจุบัน"
                    className="w-full px-4 pr-12 py-4 bg-[#F8F9FA] border border-gray-100 rounded-xl text-[#344054] placeholder-[#ABB7C2] focus:outline-none focus:border-[#40C9D5] focus:ring-2 focus:ring-[#40C9D5]/20 transition-all text-[15px] font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ABB7C2] hover:text-[#40C9D5] transition-colors"
                  >
                    {showVerifyPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: New Password */}
            {passwordStep === 2 && (
              <div className="space-y-4">
                {/* New Password Input */}
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="รหัสผ่านใหม่"
                    className="w-full px-4 pr-12 py-4 bg-[#F8F9FA] border border-gray-100 rounded-xl text-[#344054] placeholder-[#ABB7C2] focus:outline-none focus:border-[#40C9D5] focus:ring-2 focus:ring-[#40C9D5]/20 transition-all text-[15px] font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ABB7C2] hover:text-[#40C9D5] transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Confirm New Password Input */}
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    className={`w-full px-4 pr-20 py-4 bg-[#F8F9FA] border rounded-xl text-[#344054] placeholder-[#ABB7C2] focus:outline-none transition-all text-[15px] font-medium
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
                                              !passwordsMatch &&
                                              !passwordsMismatch
                                                ? "border-gray-100 focus:border-[#40C9D5] focus:ring-2 focus:ring-[#40C9D5]/20"
                                                : ""
                                            }
                                        `}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {passwordsMatch && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmNewPassword(!showConfirmNewPassword)
                      }
                      className="text-[#ABB7C2] hover:text-[#40C9D5] transition-colors"
                    >
                      {showConfirmNewPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Mismatch Message */}
                {passwordsMismatch && (
                  <p className="text-red-500 text-sm pl-1">รหัสผ่านไม่ตรงกัน</p>
                )}
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closePasswordModal}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#7E8C94] font-semibold text-[15px] rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={
                  passwordStep === 1
                    ? handleVerifyIdentity
                    : handleChangePassword
                }
                className="flex-1 py-3 bg-gradient-to-r from-[#40C9D5] to-[#2BA8B4] text-white font-semibold text-[15px] rounded-xl shadow-lg shadow-[#40C9D5]/30 hover:shadow-xl transition-all"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowRightOnRectangleIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#344054]">ออกจากระบบ</h2>
              <p className="text-[#7E8C94] text-sm mt-2">
                คุณต้องการออกจากระบบใช่หรือไม่?
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeLogoutModal}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#7E8C94] font-semibold text-[15px] rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-[15px] rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl transition-all"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
