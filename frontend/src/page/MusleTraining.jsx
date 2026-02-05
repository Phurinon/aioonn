import React, { useRef, useState, useEffect } from "react";
import Mediapipe from "../components/Mediapipe";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";
import { addTherapyHistory } from "../Functions/therapy";
import { useParams } from "react-router-dom";

export default function MusleTraining() {
  const mediapipeRef = useRef(null);
  const countIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const { patientId } = useParams();

  // Session history state
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Weight configuration states
  const [weightWhole, setWeightWhole] = useState(0); // ตัวเลขหน้าจุด
  const [weightDecimal, setWeightDecimal] = useState(0); // ตัวเลขหลังจุด
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [tempWeightWhole, setTempWeightWhole] = useState("");
  const [tempWeightDecimal, setTempWeightDecimal] = useState("");

  // Count state
  const [currentCount, setCurrentCount] = useState(0);

  const handleToggleTracking = async () => {
    if (mediapipeRef.current) {
      if (isTracking) {
        // กดหยุด → unlock และบันทึกข้อมูล
        mediapipeRef.current.unlockPerson();
        // คำนวณเวลาที่เล่น
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const data = {
            userId: user.id,
            therapyTypesId: 7,
            patientId: parseInt(patientId),
            time: Math.round(duration),
            score: currentCount,
            angle: mediapipeRef.current.getAngle(),
            weight: parseFloat(`${weightWhole}.${weightDecimal}`),
          };
          console.log("Saving therapy history:", data);
          await addTherapyHistory(data);
          setIsHistoryModalOpen(true);
        } catch (error) {
          console.error("Error saving therapy history:", error);
          alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }

        // สร้างข้อมูล session ใหม่
        const newSession = {
          id: Date.now(),
          timestamp: new Date(),
          duration: duration,
          count: currentCount,
          angle: mediapipeRef.current.getAngle(),
          weight: `${weightWhole}.${weightDecimal}`,
          note:
            currentCount >= 10
              ? "ดีเยี่ยม!"
              : currentCount >= 5
              ? "ดีมาก"
              : "พยายามต่อไป",
        };

        setSessionHistory((prev) => [newSession, ...prev]);
        setIsTracking(false);
      } else {
        // กดเริ่ม → lock คนปัจจุบัน และ reset count
        const success = mediapipeRef.current.lockCurrentPerson();
        if (success) {
          startTimeRef.current = Date.now();
          setIsTracking(true);
          setCurrentCount(0);
          if (mediapipeRef.current.resetCount) {
            mediapipeRef.current.resetCount();
          }
        }
      }
    }
  };

  // Poll count from Mediapipe when tracking
  useEffect(() => {
    if (isTracking && mediapipeRef.current) {
      countIntervalRef.current = setInterval(() => {
        if (mediapipeRef.current && mediapipeRef.current.getArmRaiseCount) {
          const count = mediapipeRef.current.getArmRaiseCount();
          setCurrentCount(count);
        }
      }, 100);
    }

    return () => {
      if (countIntervalRef.current) {
        clearInterval(countIntervalRef.current);
      }
    };
  }, [isTracking]);

  // Handle open/close history modal
  const handleOpenHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryModalOpen(false);
  };

  // Handle weight modal
  const handleOpenWeightModal = () => {
    // เปิด modal ด้วยค่าว่าง เพื่อให้พิมได้ง่าย
    setTempWeightWhole(weightWhole === 0 ? "" : weightWhole.toString());
    setTempWeightDecimal(weightDecimal === 0 ? "" : weightDecimal.toString());
    setIsWeightModalOpen(true);
  };

  const handleCloseWeightModal = () => {
    setIsWeightModalOpen(false);
  };

  const handleConfirmWeight = () => {
    const whole = parseInt(tempWeightWhole) || 0;
    const decimal = parseInt(tempWeightDecimal) || 0;
    setWeightWhole(whole);
    setWeightDecimal(decimal);
    setIsWeightModalOpen(false);
  };

  // Handle weight input changes - replace 0 with typed number
  const handleWholeChange = (e) => {
    const value = e.target.value;
    // ลบ leading zeros และจำกัดความยาว
    const cleaned = value.replace(/^0+/, "") || "";
    if (cleaned.length <= 3) {
      setTempWeightWhole(cleaned);
    }
  };

  const handleDecimalChange = (e) => {
    const value = e.target.value;
    // ลบ leading zeros และจำกัดเป็น 1 ตัว
    const cleaned = value.replace(/^0+/, "") || "";
    if (cleaned.length <= 1) {
      setTempWeightDecimal(cleaned);
    }
  };

  // Format weight for display
  const formatWeight = () => {
    return `${weightWhole}.${weightDecimal}`;
  };

  return (
    <div className="w-full h-[calc(100vh-73px)] flex flex-col overflow-hidden">
      {/* Main camera area */}
      <div className="flex-1 flex items-center justify-center bg-[#F3FBFC] overflow-hidden relative">
        <div className="w-full h-full flex items-center justify-center">
          <Mediapipe ref={mediapipeRef} mode="byself" enableCounting={true} />
        </div>

        {/* Weight & Count Display - Top Right */}
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 min-w-[160px]">
          {/* Weight */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center text-xl">
              🏋️
            </div>
            <div>
              <div className="text-sm text-[#7E8C94]">น้ำหนัก</div>
              <div className="text-xl font-bold text-[#344054]">
                {formatWeight()}{" "}
                <span className="text-sm font-normal text-[#7E8C94]">กก.</span>
              </div>
            </div>
          </div>

          {/* Count - show when tracking */}
          {isTracking && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="w-10 h-10 bg-[#E8F8FA] rounded-full flex items-center justify-center text-xl">
                💪
              </div>
              <div>
                <div className="text-sm text-[#7E8C94]">จำนวนครั้ง</div>
                <div className="text-2xl font-bold text-[#40C9D5]">
                  {currentCount}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weight Settings Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-[fadeIn_0.3s_ease-out]">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🏋️
              </div>
              <h2 className="text-2xl font-bold text-[#344054]">
                ตั้งค่าน้ำหนัก
              </h2>
              <p className="text-[#7E8C94] mt-1">
                กำหนดน้ำหนักที่ใช้ในการออกกำลังกาย
              </p>
            </div>

            {/* Weight Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#344054] mb-3">
                น้ำหนัก (กิโลกรัม)
              </label>
              <div className="flex items-center justify-center gap-2">
                {/* Whole number input */}
                <input
                  type="number"
                  value={tempWeightWhole}
                  onChange={handleWholeChange}
                  placeholder="0"
                  className="w-24 px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent text-2xl text-center font-bold"
                  min="0"
                  max="999"
                />
                {/* Decimal point */}
                <span className="text-3xl font-bold text-[#344054]">.</span>
                {/* Decimal input */}
                <input
                  type="number"
                  value={tempWeightDecimal}
                  onChange={handleDecimalChange}
                  placeholder="0"
                  className="w-20 px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent text-2xl text-center font-bold"
                  min="0"
                  max="9"
                />
                {/* Unit */}
                <span className="text-xl font-medium text-[#7E8C94] ml-2">
                  กก.
                </span>
              </div>
              <p className="text-center text-sm text-[#7E8C94] mt-3">
                ตัวอย่าง: {tempWeightWhole || 0}.{tempWeightDecimal || 0}{" "}
                กิโลกรัม
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseWeightModal}
                className="flex-1 py-3 border border-gray-200 text-[#7E8C94] font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmWeight}
                className="flex-1 py-3 bg-[#40C9D5] text-white font-semibold rounded-xl hover:bg-[#2BA8B4] transition shadow-md"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-8 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          {/* Left side - Weight button + Mode info */}
          <div className="flex items-center gap-4">
            {/* Weight Button */}
            <button
              onClick={handleOpenWeightModal}
              disabled={isTracking}
              className={`px-5 py-3 font-semibold rounded-xl transition flex items-center gap-2 ${
                isTracking
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#C8E6C9]"
              }`}
            >
              <span className="text-lg">🏋️</span>
              น้ำหนัก
            </button>

            {/* Divider */}
            <div className="w-px h-10 bg-gray-200"></div>

            {/* Mode info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8F5E9] rounded-full flex items-center justify-center text-2xl">
                💪
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[#344054] text-lg">
                  เสริมสร้างกล้ามเนื้อ
                </span>
                {isTracking ? (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    ยกได้ {currentCount} ครั้ง
                  </span>
                ) : sessionHistory.length > 0 ? (
                  <span className="text-sm text-[#7E8C94]">
                    เล่นไปแล้ว {sessionHistory.length} รอบ • {formatWeight()}{" "}
                    กก.
                  </span>
                ) : (
                  <span className="text-sm text-[#7E8C94]">
                    {formatWeight()} กิโลกรัม
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenHistory}
              className="px-6 py-3 text-[#40C9D5] font-semibold hover:bg-[#E8F8FA] rounded-lg transition"
            >
              สรุปผล
            </button>
            <button
              onClick={handleToggleTracking}
              className={`px-8 py-3 font-semibold rounded-lg transition shadow-md min-w-[120px] ${
                isTracking
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-[#40C9D5] text-white hover:bg-[#2BA8B4]"
              }`}
            >
              {isTracking ? "หยุด" : "เริ่ม"}
            </button>
          </div>
        </div>
      </div>

      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistory}
        history={sessionHistory}
        exerciseName="เสริมสร้างกล้ามเนื้อ"
        exerciseIcon="💪"
      />
    </div>
  );
}
