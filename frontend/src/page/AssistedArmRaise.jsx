import React, { useRef, useState, useEffect } from "react";
import Mediapipe from "../components/Mediapipe";
import { addTherapyHistory } from "../Functions/therapy";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";
import { useParams } from "react-router-dom";
import usePatientLevelThreshold from "../hooks/usePatientLevelThreshold";

export default function AssistedArmRaise() {
  const mediapipeRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const startTimeRef = useRef(null);
  const { patientId } = useParams();

  // Settings
  const threshold = usePatientLevelThreshold(patientId);

  // Session history state
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Count and Angle state
  const [currentCount, setCurrentCount] = useState(0);
  const [currentMaxAngle, setCurrentMaxAngle] = useState(0);
  const countIntervalRef = useRef(null);

  const handleToggleTracking = async () => {
    if (mediapipeRef.current) {
      if (isTracking) {
        // กดหยุด → unlock และบันทึกข้อมูล
        mediapipeRef.current.unlockPerson();

        // คำนวณเวลาที่เล่น
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // สร้างข้อมูล session ใหม่
        const newSession = {
          id: Date.now(),
          timestamp: new Date(),
          duration: duration,
          count: currentCount,
          maxAngle: currentMaxAngle,
          assistedBy: "ผู้ช่วย",
          note: "ยกแขนร่วมกับผู้ช่วยได้ดี",
        };

        setSessionHistory((prev) => [newSession, ...prev]);
        setIsTracking(false);

        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const data = {
            userId: user.id,
            therapyTypesId: 1,
            patientId: parseInt(patientId),
            time: Math.round(duration),
            score: currentCount,
            angle: currentMaxAngle,
          };
          console.log("Saving therapy history:", data);
          await addTherapyHistory(data);

          // Show history modal instead of alert
          setIsHistoryModalOpen(true);
        } catch (error) {
          console.error("Error saving therapy history:", error);
          alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } else {
        // กดเริ่ม → lock คนปัจจุบันหรือที่เจอคนแรก
        const success = mediapipeRef.current.lockCurrentPerson();
        if (success) {
          startTimeRef.current = Date.now();
          setIsTracking(true);
          setCurrentCount(0);
          setCurrentMaxAngle(0);
          if (mediapipeRef.current.resetCount) {
            mediapipeRef.current.resetCount();
          }
        }
      }
    }
  };

  // Poll count and angle from Mediapipe when tracking
  useEffect(() => {
    if (isTracking && mediapipeRef.current) {
      countIntervalRef.current = setInterval(() => {
        if (mediapipeRef.current) {
          if (mediapipeRef.current.getArmRaiseCount) {
            setCurrentCount(mediapipeRef.current.getArmRaiseCount());
          }
          if (mediapipeRef.current.getAngle) {
            setCurrentMaxAngle(mediapipeRef.current.getAngle());
          }
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

  return (
    <div className="w-full h-[calc(100vh-73px)] flex flex-col overflow-hidden">
      {/* Main camera area - ใช้พื้นที่ทั้งหมดที่เหลือ */}
      <div className="flex-1 flex items-center justify-center bg-[#F3FBFC] overflow-hidden relative">
        {/* จอกล้อง - ใช้ Mediapipe component */}
        <div className="w-full h-full flex items-center justify-center">
          <Mediapipe
            ref={mediapipeRef}
            mode="assisted"
            enableCounting={true}
            angleThreshold={threshold}
          />
        </div>

        {/* Real-time Stats Display - Top Right */}
        {isTracking && (
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 min-w-[140px]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#E8F8FA] rounded-full flex items-center justify-center text-2xl">
                  🔢
                </div>
                <div>
                  <div className="text-sm text-[#7E8C94]">จำนวนครั้ง</div>
                  <div className="text-3xl font-bold text-[#40C9D5]">
                    {currentCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 min-w-[140px]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FFF4E5] rounded-full flex items-center justify-center text-2xl">
                  📐
                </div>
                <div>
                  <div className="text-sm text-[#7E8C94]">องศาสูงสุด</div>
                  <div className="text-3xl font-bold text-[#344054]">
                    {currentMaxAngle}°
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar - ติดกับขอบล่างจอ */}
      <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-8 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {/* Mode info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E8F8FA] rounded-full flex items-center justify-center text-2xl">
              👥
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[#344054] text-lg">
                มีผู้ช่วยยกแขน
              </span>
              {isTracking ? (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  ยกได้ {currentCount} ครั้ง (สูงสุด {currentMaxAngle}°)
                </span>
              ) : sessionHistory.length > 0 ? (
                <span className="text-sm text-[#7E8C94]">
                  เล่นไปแล้ว {sessionHistory.length} รอบ
                </span>
              ) : (
                <span className="text-sm text-[#7E8C94]">
                  กดเริ่มเพื่อเริ่มติดตาม
                </span>
              )}
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

      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistory}
        history={sessionHistory}
        exerciseName="มีผู้ช่วยยกแขน"
        exerciseIcon="👥"
      />
    </div>
  );
}
