import React, { useState, useEffect } from "react";
import { addPatient, addPatientSymptom } from "../Functions/patient";
import { getSymptom } from "../Functions/symptom";

/**
 * Modal สำหรับเพิ่มผู้ป่วยใหม่
 * มี 2 step:
 * 1. กรอกชื่อและนามสกุล
 * 2. ยืนยันข้อมูล
 */
export default function AddPatientModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [symptom, setSymptom] = useState("");
  const [symptomsList, setSymptomsList] = useState([]);
  const [level, setLevel] = useState("");
  const [arm, setArm] = useState("");

  // console.log(symptomsList.find((item) => item.id == symptom)?.title);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await getSymptom();
        if (response && response.data) {
          setSymptomsList(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch symptoms:", error);
      }
    };
    fetchSymptoms();
  }, []);

  // Reset state เมื่อปิด modal
  const handleClose = () => {
    setStep(1);
    setFirstName("");
    setLastName("");
    setSymptom("");
    setLevel("");
    setArm("");
    onClose();
  };

  // ไปขั้นตอนยืนยัน
  const handleSubmit = () => {
    if (firstName.trim() && lastName.trim() && symptom && level && arm) {
      setStep(2);
    }
  };

  // ยืนยันข้อมูลถูกต้อง - บันทึกและ reload
  const handleConfirm = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const newPatient = await addPatient({
        firstName,
        lastName,
        userId: user.id, // removed fallback to force valid user login, or handled elsewhere
      });

      if (symptom) {
        await addPatientSymptom({
          patientId: newPatient.id,
          symptomsId: parseInt(symptom),
          level: parseInt(level),
          armSide: arm,
        });
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to add patient:", error);
      handleClose();
    }
  };

  // ข้อมูลไม่ถูกต้อง - ปิด modal
  const handleReject = () => {
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#40C9D5] to-[#35B5C0] px-6 py-5">
          <h2 className="text-white text-xl font-semibold text-center">
            {step === 1 ? "เพิ่มผู้ป่วยใหม่" : "ยืนยันข้อมูล"}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-8">
          {step === 1 ? (
            /* Step 1: กรอกข้อมูล */
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
              <div>
                <label className="block text-[#333E4D] font-medium mb-2">
                  อาการ <span className="text-red-500">*</span>
                </label>
                <select
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent transition-all text-[#333E4D] bg-white"
                >
                  <option value="">เลือกอาการ</option>
                  {symptomsList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#333E4D] font-medium mb-2">
                  ระดับอาการ (1-5) <span className="text-red-500">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent transition-all text-[#333E4D] bg-white"
                >
                  <option value="">เลือกระดับอาการ</option>
                  {[1, 2, 3, 4, 5].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#333E4D] font-medium mb-2">
                  ข้างที่มีอาการ <span className="text-red-500">*</span>
                </label>
                <select
                  value={arm}
                  onChange={(e) => setArm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent transition-all text-[#333E4D] bg-white"
                >
                  <option value="">เลือกข้าง</option>
                  <option value="ซ้าย">ซ้าย</option>
                  <option value="ขวา">ขวา</option>
                  <option value="ทั้งสองข้าง">ทั้งสองข้าง</option>
                </select>
              </div>
            </div>
          ) : (
            /* Step 2: ยืนยันข้อมูล */
            <div className="text-center space-y-4">
              <div className="bg-[#F0FAFB] rounded-xl p-6">
                <p className="text-[#7E8C94] text-sm mb-2">ชื่อ-นามสกุล</p>
                <p className="text-[#333E4D] text-2xl font-semibold">
                  {firstName} {lastName}
                </p>
                <p className="text-[#7E8C94] text-sm mb-2">อาการ</p>
                <p className="text-[#333E4D] text-2xl font-semibold">
                  {symptomsList.find((item) => item.id == symptom)?.title}
                </p>
                <p className="text-[#7E8C94] text-sm mb-2">ระดับอาการ</p>
                <p className="text-[#333E4D] text-2xl font-semibold">{level}</p>
                <p className="text-[#7E8C94] text-sm mb-2">ข้างที่มีอาการ</p>
                <p className="text-[#333E4D] text-2xl font-semibold">{arm}</p>
              </div>
              <p className="text-[#7E8C94] text-base">
                ชื่อ-นามสกุลและอาการถูกต้องหรือไม่?
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          {step === 1 ? (
            <>
              {/* Step 1: ยกเลิก (ซ้าย) และ ตกลง (ขวา) */}
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-[#7E8C94] font-medium hover:bg-gray-50 transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !symptom ||
                  !level ||
                  !arm
                }
                className="flex-1 px-6 py-3 bg-[#40C9D5] text-white rounded-xl font-medium hover:bg-[#35B5C0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ตกลง
              </button>
            </>
          ) : (
            <>
              {/* Step 2: ไม่ (ซ้าย) และ ใช่ (ขวา) */}
              <button
                onClick={handleReject}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-[#7E8C94] font-medium hover:bg-gray-50 transition-all"
              >
                ไม่
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-3 bg-[#40C9D5] text-white rounded-xl font-medium hover:bg-[#35B5C0] transition-all"
              >
                ใช่
              </button>
            </>
          )}
        </div>
      </div>

      {/* Animation styles */}
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
