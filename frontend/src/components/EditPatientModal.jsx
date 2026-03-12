import React, { useState, useEffect } from "react";
import { updatePatient } from "../Functions/patient";

export default function EditPatientModal({ isOpen, onClose, patientData }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patientData) {
      setFirstName(patientData.firstName || "");
      setLastName(patientData.lastName || "");
    }
  }, [patientData]);

  const handleClose = () => {
    setFirstName("");
    setLastName("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    
    setLoading(true);
    try {
      await updatePatient(patientData.id, {
        firstName,
        lastName,
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update patient:", error);
      // Wait for UI alert config if error, for now ignore since AddPatientModal does this
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#40C9D5] to-[#35B5C0] px-6 py-5">
          <h2 className="text-white text-xl font-semibold text-center">
            แก้ไขข้อมูลผู้ป่วย
          </h2>
        </div>

        <div className="px-6 py-8">
          <div className="space-y-5">
            <div>
              <label className="block text-[#333E4D] font-medium mb-2">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="กรอกชื่อ"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent transition-all text-[#333E4D]"
              />
            </div>
            <div>
              <label className="block text-[#333E4D] font-medium mb-2">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="กรอกนามสกุล"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent transition-all text-[#333E4D]"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-[#7E8C94] font-medium hover:bg-gray-50 transition-all"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!firstName.trim() || !lastName.trim() || loading}
            className="flex-1 px-6 py-3 bg-[#40C9D5] text-white rounded-xl font-medium hover:bg-[#35B5C0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "กำลังบันทึก..." : "อัปเดต"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
