import React, { useRef, useState } from "react";
import Mediapipe from "../../components/Mediapipe";
import { addTherapyHistory } from "../../Functions/therapy";
import ExerciseHistoryModal from "../../components/ExerciseHistoryModal";
import { useParams } from "react-router-dom";

export default function Balance({
    isRoutineMode = false,
    autoStart = true,
    presetTargetTime = 0,
    onComplete = null
}) {
    const { patientId } = useParams();
    const mediapipeRef = useRef(null);
    const [isTracking, setIsTracking] = useState(false);
    const startTimeRef = useRef(null);
    const timerRef = useRef(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Session history state
    const [sessionHistory, setSessionHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Effects for routine mode
    useEffect(() => {
        if (isRoutineMode && autoStart) {
            // Start automatically in routine mode if requested
            const timer = setTimeout(() => {
                handleStart();
            }, 3000);
            return () => {
                clearTimeout(timer);
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [isRoutineMode, autoStart]);

    const handleStart = () => {
        if (mediapipeRef.current && !isTracking) {
            const success = mediapipeRef.current.lockCurrentPerson();
            if (success) {
                startTimeRef.current = Date.now();
                setIsTracking(true);
                setElapsedTime(0);

                if (isRoutineMode) {
                    timerRef.current = setInterval(() => {
                        const now = Math.floor((Date.now() - startTimeRef.current) / 1000);
                        setElapsedTime(now);
                        if (now >= presetTargetTime) {
                            handleStop();
                        }
                    }, 1000);
                }
            }
        }
    };

    const handleStop = async () => {
        if (mediapipeRef.current && isTracking) {
            mediapipeRef.current.unlockPerson();
            if (timerRef.current) clearInterval(timerRef.current);

            // คำนวณเวลาที่เล่น
            const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

            // สร้างข้อมูล session ใหม่ (mock data)
            const balanceScore = Math.floor(Math.random() * 30) + 70; // 70-100 คะแนน
            const newSession = {
                id: Date.now(),
                timestamp: new Date(),
                duration: duration,
                score: balanceScore,
                stability: balanceScore >= 90 ? "ดีมาก" : balanceScore >= 80 ? "ดี" : "ปานกลาง",
                note: "การทรงตัวอยู่ในเกณฑ์" + (balanceScore >= 80 ? "ดี" : "พอใช้")
            };

            setSessionHistory(prev => [newSession, ...prev]);
            setIsTracking(false);

            // Save to database
            try {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                const data = {
                    userId: user.id,
                    therapyTypesId: 4, // Balance
                    patientId: parseInt(patientId),
                    score: balanceScore,
                    time: duration,
                    angle: mediapipeRef.current?.getAngle() || 0,
                };
                await addTherapyHistory(data);
            } catch (error) {
                console.error("Error saving balance history:", error);
            }

            // Auto transition for routine mode
            if (isRoutineMode && onComplete) {
                setTimeout(() => {
                    onComplete({ count: balanceScore, time: duration });
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

    // Handle open/close history modal
    const handleOpenHistory = () => {
        setIsHistoryModalOpen(true);
    };

    const handleCloseHistory = () => {
        setIsHistoryModalOpen(false);
    };

    return (
        <div className="w-full h-[calc(100vh-73px)] flex flex-col overflow-hidden">
            {/* Main camera area */}
            <div className="flex-1 flex items-center justify-center bg-[#F3FBFC] overflow-hidden relative">
                <div className="w-full h-full flex items-center justify-center">
                    <Mediapipe
                        ref={mediapipeRef}
                        mode="byself"
                    />
                </div>
            </div>

            {/* Bottom bar */}
            <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-8 py-4 flex-shrink-0">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    {/* Mode info */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#FFF4E5] rounded-full flex items-center justify-center text-2xl">
                            ⚖️
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-[#344054] text-lg">
                                ทดสอบการทรงตัว
                            </span>
                            {isTracking ? (
                                <span className="text-sm text-green-600 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    กำลังติดตามผู้ใช้
                                </span>
                            ) : sessionHistory.length > 0 ? (
                                <span className="text-sm text-[#7E8C94]">
                                    เล่นไปแล้ว {sessionHistory.length} รอบ
                                </span>
                            ) : (
                                <span className="text-sm text-[#7E8C94]">
                                    กดเริ่มเพื่อทดสอบ
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
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-[#40C9D5] text-white hover:bg-[#2BA8B4]'
                                }`}
                        >
                            {isTracking ? 'หยุด' : 'เริ่ม'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Exercise History Modal */}
            <ExerciseHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={handleCloseHistory}
                history={sessionHistory}
                exerciseName="ทดสอบการทรงตัว"
                exerciseIcon="⚖️"
            />
        </div>
    );
}
