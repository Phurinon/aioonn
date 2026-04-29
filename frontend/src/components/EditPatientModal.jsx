import React, { useState, useEffect } from "react";
import { updatePatient, addPatientSymptom } from "../Functions/patient";
import { getSymptom } from "../Functions/symptom";

/**
 * Modal สำหรับแก้ไขข้อมูลผู้ป่วย
 */
export default function EditPatientModal({ isOpen, onClose, patient }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [symptom, setSymptom] = useState("");
  const [symptomsList, setSymptomsList] = useState([]);
  const [arm, setArm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  // เมื่อเปิด Modal หรือเปลี่ยนคนไข้ ให้โหลดข้อมูลมาใส่ State
  useEffect(() => {
    if (isOpen && patient) {
      setFirstName(patient.firstName || "");
      setLastName(patient.lastName || "");
      
      const firstSymptom = patient.patientSymptoms && patient.patientSymptoms[0];
      if (firstSymptom) {
        setSymptom(firstSymptom.symptomsId.toString());
        setArm(firstSymptom.armSide || "");
      } else {
        setSymptom("");
        setArm("");
      }
      setStep(1);
    }
  }, [isOpen, patient]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (firstName.trim() && lastName.trim() && symptom && arm) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      // เรียก API เดียวกันที่ผมเพิ่งอัปเดตให้รองรับ symptomsId และ armSide
      await updatePatient(patient.id, {
        firstName,
        lastName,
        symptomsId: parseInt(symptom),
        armSide: arm,
      });

      window.location.reload();
    } catch (error) {
      console.error("Failed to update patient:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#40C9D5] to-[#35B5C0] px-8 py-6">
          <h2 className="text-white text-2xl font-bold text-center">
            {step === 1 ? "แก้ไขข้อมูลผู้ป่วย" : "ยืนยันการแก้ไข"}
          </h2>
        </div>

        <div className="px-8 py-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-[#344054] font-bold mb-2 ml-1">ชื่อ</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#40C9D5] focus:bg-white transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-[#344054] font-bold mb-2 ml-1">นามสกุล</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#40C9D5] focus:bg-white transition-all font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#344054] font-bold mb-2 ml-1">อาการ</label>
                  <select
                    value={symptom}
                    onChange={(e) => setSymptom(e.target.value)}
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#40C9D5] focus:bg-white transition-all font-medium appearance-none"
                  >
                    <option value="">เลือกอาการ</option>
                    {symptomsList.map((item) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#344054] font-bold mb-2 ml-1">ข้าง</label>
                  <select
                    value={arm}
                    onChange={(e) => setArm(e.target.value)}
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#40C9D5] focus:bg-white transition-all font-medium appearance-none"
                  >
                    <option value="">เลือกข้าง</option>
                    <option value="ซ้าย">ซ้าย</option>
                    <option value="ขวา">ขวา</option>
                    <option value="ทั้งสองข้าง">ทั้งสองข้าง</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#F3FBFC] rounded-3xl p-6 border-2 border-[#40C9D5]/10">
                <div className="space-y-4">
                  <div>
                    <p className="text-[#7E8C94] text-xs font-bold uppercase tracking-wider mb-1">ชื่อ-นามสกุล</p>
                    <p className="text-[#333E4D] text-xl font-bold">{firstName} {lastName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[#7E8C94] text-xs font-bold uppercase tracking-wider mb-1">อาการ</p>
                      <p className="text-[#333E4D] font-bold">{symptomsList.find((item) => item.id == symptom)?.title}</p>
                    </div>
                    <div>
                      <p className="text-[#7E8C94] text-xs font-bold uppercase tracking-wider mb-1">ข้าง</p>
                      <p className="text-[#333E4D] font-bold">{arm}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[#7E8C94] text-center font-medium">คุณยืนยันที่จะแก้ไขข้อมูลตามนี้ใช่หรือไม่?</p>
            </div>
          )}
        </div>

        <div className="px-8 pb-8 flex gap-4">
          <button
            onClick={() => setStep(1)}
            style={{ display: step === 2 ? 'block' : 'none' }}
            className="flex-1 py-4 border-2 border-gray-100 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-all"
          >
            ย้อนกลับ
          </button>
          <button
            onClick={step === 1 ? handleSubmit : handleConfirm}
            disabled={isSaving || (step === 1 && (!firstName.trim() || !lastName.trim() || !symptom || !arm))}
            className="flex-1 py-4 bg-[#40C9D5] text-white rounded-2xl font-bold shadow-lg shadow-[#40C9D5]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {isSaving ? "กำลังบันทึก..." : (step === 1 ? "ตรวจสอบ" : "ยืนยันการแก้ไข")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
