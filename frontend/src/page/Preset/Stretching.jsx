import React, { useRef, useState, useEffect } from "react";
import Mediapipe from "../../components/Mediapipe";
import ExerciseHistoryModal from "../../components/ExerciseHistoryModal";
import { addTherapyHistory } from "../../Functions/therapy";
import { useParams } from "react-router-dom";

export default function Stretching({
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

    // Configuration states
    const [targetTime, setTargetTime] = useState(60); // Default 60 seconds
    const [timeLeft, setTimeLeft] = useState(60);

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
                note: currentCount >= 5 ? "ยืดเหยียดได้ดี!" : "พยายามต่อไป",
            };

            setSessionHistory((prev) => [newSession, ...prev]);
            setIsTracking(false);

            // Auto transition for routine mode
            if (isRoutineMode && onComplete) {
                setTimeout(() => {
                    onComplete({ count: currentCount, time: duration });
                }, 2000);
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
    }, [isTracking]);

    return (
        <div className="w-full h-[calc(100vh-73px)] flex flex-col overflow-hidden">
            {/* Main camera area */}
            <div className="flex-1 flex items-center justify-center bg-[#F3FBFC] overflow-hidden relative">
                <div className="w-full h-full flex items-center justify-center">
                    <Mediapipe ref={mediapipeRef} mode="byself" enableCounting={true} />
                </div>

                {/* Info Display - Top Right */}
                <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 min-w-[160px]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-[#FFF3E0] rounded-full flex items-center justify-center text-xl">
                            🧘
                        </div>
                        <div>
                            <div className="text-sm text-[#7E8C94]">หมวดหมู่</div>
                            <div className="text-xl font-bold text-[#344054]">ยืดเหยียด</div>
                        </div>
                    </div>

                    {isTracking && (
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
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

            {/* Bottom bar */}
            <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-8 py-4 flex-shrink-0">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#FFF3E0] rounded-full flex items-center justify-center text-2xl">
                                🧘
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-[#344054] text-lg">
                                    การยืดเหยียดร่างกาย
                                </span>
                                <span className="text-sm text-[#7E8C94]">
                                    รักษาความยืดหยุ่นของกล้ามเนื้อ
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsHistoryModalOpen(true)}
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

            <ExerciseHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                history={sessionHistory}
                exerciseName="การยืดเหยียดร่างกาย"
                exerciseIcon="🧘"
            />
        </div>
    );
}
