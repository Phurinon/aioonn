import React, { useRef, useState, useEffect } from "react";
import Mediapipe from "../../components/Mediapipe";
import ExerciseHistoryModal from "../../components/ExerciseHistoryModal";
import { addTherapyHistory } from "../../Functions/therapy";
import { useParams } from "react-router-dom";

export default function MusleTraining({
  isRoutineMode = false,
  autoStart = true,
  presetTargetTime = 0,
  presetTargetCount = 0,
  onComplete = null
}) {
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

  // Effects for routine mode
  useEffect(() => {
    if (isRoutineMode && autoStart) {
      // Start automatically in routine mode if requested
      const timer = setTimeout(() => {
        handleStart();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isRoutineMode, autoStart]);

  const handleStart = () => {
    if (mediapipeRef.current && !isTracking) {
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
  };

  const handleStop = async () => {
    if (mediapipeRef.current && isTracking) {
      // กดหยุด → unlock และบันทึกข้อมูล
      mediapipeRef.current.unlockPerson();
      if (countIntervalRef.current) clearInterval(countIntervalRef.current);

      // คำนวณเวลาที่เล่น
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const data = {
          userId: user.id,
          therapyTypesId: 6,
          patientId: parseInt(patientId),
          time: Math.round(duration),
          score: currentCount,
          angle: mediapipeRef.current.getAngle(),
          weight: parseFloat(`${weightWhole}.${weightDecimal}`),
        };
        console.log("Saving therapy history:", data);
        await addTherapyHistory(data);
      } catch (error) {
        console.error("Error saving therapy history:", error);
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

      // Auto transition for routine mode
      if (isRoutineMode && onComplete) {
        setTimeout(() => {
          onComplete({ count: currentCount, time: duration });
        }, 2000);
      } else {
        setIsHistoryModalOpen(true);
      }
    }
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      handleStop();
    } else {
      handleStart();
    }
  };

  // Poll count from Mediapipe when tracking
  useEffect(() => {
    if (isTracking && mediapipeRef.current) {
      countIntervalRef.current = setInterval(() => {
        if (mediapipeRef.current && mediapipeRef.current.getArmRaiseCount) {
          const count = mediapipeRef.current.getArmRaiseCount();
          setCurrentCount(count);

          // Check for auto-stop in routine mode
          if (isRoutineMode) {
            const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            if ((presetTargetCount > 0 && count >= presetTargetCount) ||
              (presetTargetTime > 0 && duration >= presetTargetTime)) {
              handleStop();
            }
          }
        }
      }, 100);
    }

    return () => {
      if (countIntervalRef.current) {
        clearInterval(countIntervalRef.current);
      }
    };
  }, [isTracking, isRoutineMode, presetTargetCount, presetTargetTime]);

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
          <Mediapipe ref={mediapipeRef} mode="byself" />
        </div>

        {/* Info Display - Top Right */}
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 min-w-[200px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center text-xl">
              🏋️
            </div>
            <div>
              <div className="text-sm text-[#7E8C94]">หมวดหมู่</div>
              <div className="text-xl font-bold text-[#344054]">
                เสริมสร้างกล้ามเนื้อ
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="w-10 h-10 bg-[#E3F2FD] rounded-full flex items-center justify-center text-xl">
                ⚖️
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#7E8C94]">น้ำหนักปัจจุบัน</div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#2196F3]">
                    {formatWeight()}
                  </span>
                  <span className="text-sm font-medium text-[#7E8C94]">กิโลกรัม</span>
                </div>
              </div>
            </div>

            {isTracking && (
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100 animate-[fadeIn_0.3s_ease-out]">
                <div className="w-10 h-10 bg-[#E8F8FA] rounded-full flex items-center justify-center text-xl">
                  🔢
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
      </div>

      {/* Bottom bar */}
      <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-8 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8F5E9] rounded-full flex items-center justify-center text-2xl">
                🏋️
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[#344054] text-lg">
                  การฝึกความแข็งแรง
                </span>
                <span className="text-sm text-[#7E8C94]">
                  เสริมสร้างกล้ามเนื้อด้วยน้ำหนักที่เหมาะสม
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenWeightModal}
              disabled={isTracking}
              className={`px-6 py-3 font-semibold rounded-lg transition border-2 ${isTracking
                ? "border-gray-100 text-gray-300 pointer-events-none"
                : "border-[#40C9D5] text-[#40C9D5] hover:bg-[#E8F8FA]"
                }`}
            >
              ตั้งค่าน้ำหนัก
            </button>
            <button
              onClick={handleOpenHistory}
              className="px-6 py-3 text-[#40C9D5] font-semibold hover:bg-[#E8F8FA] rounded-lg transition"
            >
              ประวัติการฝึก
            </button>
            <button
              onClick={handleToggleTracking}
              className={`px-8 py-3 font-semibold rounded-lg transition shadow-md min-w-[120px] ${isTracking
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-[#40C9D5] text-white hover:bg-[#2BA8B4]"
                }`}
            >
              {isTracking ? "หยุด" : "เริ่ม"}
            </button>
          </div>
        </div>
      </div>

      {/* Weight Input Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative shadow-2xl animate-[zoomIn_0.3s_ease-out]">
            <h3 className="text-2xl font-bold text-[#344054] mb-6 text-center">
              ตั้งค่าน้ำหนัก
            </h3>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="relative group">
                <input
                  type="number"
                  value={tempWeightWhole}
                  onChange={handleWholeChange}
                  placeholder="0"
                  className="w-24 h-24 text-center text-4xl font-bold bg-gray-50 border-2 border-transparent focus:border-[#40C9D5] focus:bg-white rounded-2xl transition outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                <span className="absolute -bottom-6 left-0 w-full text-center text-xs font-bold text-[#7E8C94] uppercase tracking-wider">
                  กิโลกรัม
                </span>
              </div>

              <div className="text-4xl font-bold text-[#344054]">.</div>

              <div className="relative group">
                <input
                  type="number"
                  value={tempWeightDecimal}
                  onChange={handleDecimalChange}
                  placeholder="0"
                  className="w-24 h-24 text-center text-4xl font-bold bg-gray-50 border-2 border-transparent focus:border-[#40C9D5] focus:bg-white rounded-2xl transition outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute -bottom-6 left-0 w-full text-center text-xs font-bold text-[#7E8C94] uppercase tracking-wider">
                  กรัม (x100)
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCloseWeightModal}
                className="flex-1 py-3 font-semibold text-[#7E8C94] hover:bg-gray-50 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmWeight}
                className="flex-1 py-3 font-semibold text-white bg-[#40C9D5] hover:bg-[#2BA8B4] rounded-xl transition shadow-lg"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      <ExerciseHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistory}
        history={sessionHistory}
        exerciseName="การฝึกความแข็งแรง"
        exerciseIcon="🏋️"
      />
    </div>
  );
}
