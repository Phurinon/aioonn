import React, { useRef, useState } from "react";
import Mediapipe from "../components/Mediapipe";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";

export default function Balance() {
    const mediapipeRef = useRef(null);
    const [isTracking, setIsTracking] = useState(false);
    const startTimeRef = useRef(null);

    // Session history state
    const [sessionHistory, setSessionHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const handleToggleTracking = () => {
        if (mediapipeRef.current) {
            if (isTracking) {
                // กดหยุด → unlock และบันทึกข้อมูล
                mediapipeRef.current.unlockPerson();

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
            } else {
                // กดเริ่ม → lock คนปัจจุบัน
                const success = mediapipeRef.current.lockCurrentPerson();
                if (success) {
                    startTimeRef.current = Date.now();
                    setIsTracking(true);
                }
            }
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
