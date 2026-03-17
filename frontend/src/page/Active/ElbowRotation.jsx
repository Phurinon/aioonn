import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Mediapipe from "../../components/Mediapipe";
import { addTherapyHistory, getTherapyType } from "../../Functions/therapy";
import ExerciseHistoryModal from "../../components/ExerciseHistoryModal";
import usePatientRomThreshold from "../../hooks/usePatientRomThreshold";

export default function ElbowRotation({
    isRoutineMode = false,
    autoStart = true,
    presetTargetCount = 0,
    onComplete = null
}) {
    const { patientId } = useParams();
    const mediapipeRef = useRef(null);

    const modeTitle = "Elbow Rotation (หมุนศอก)";
    const trackingMode = "elbow";
    const description = "งอศอกและหมุนแขนเข้า-ออก";

    const timerIntervalRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const isProcessingFinish = useRef(false);

    // Settings
    // Use the max achieved rotation from daily testing, fallback to 150
    const thresholds = usePatientRomThreshold(patientId, 'ExternalRotation');

    // Configuration states
    const [selectedArm, setSelectedArm] = useState("right");
    const [isConfigured, setIsConfigured] = useState(isRoutineMode);
    const [targetCount, setTargetCount] = useState(presetTargetCount);

    const threshold = (selectedArm === 'left' ? thresholds.left : thresholds.right) || 150;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTargetCount, setModalTargetCount] = useState("");
    const [modalSelectedArm, setModalSelectedArm] = useState("right");

    // Running states
    const [isTracking, setIsTracking] = useState(false);
    const [isCountdown, setIsCountdown] = useState(false);
    const [countdownValue, setCountdownValue] = useState(3);
    const [isRunning, setIsRunning] = useState(false);
    
    // Time tracking counts UP
    const [timeElapsed, setTimeElapsed] = useState(0); 
    const [currentCount, setCurrentCount] = useState(0);
    const [currentRealtimeAngle, setCurrentRealtimeAngle] = useState(0);

    // Effects for routine mode
    useEffect(() => {
        if (isRoutineMode) {
            setTargetCount(presetTargetCount);
            setTimeElapsed(0);
            setIsConfigured(true);

            // Start automatically in routine mode if requested
            if (autoStart) {
                const timer = setTimeout(() => {
                    handleStart();
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isRoutineMode, autoStart, presetTargetCount]);

    // Finish states
    const [isFinished, setIsFinished] = useState(false);
    const [finalTime, setFinalTime] = useState(0);
    const [finalCount, setFinalCount] = useState(0);
    const [avgAngle, setAvgAngle] = useState(0);

    // Session history state
    const [sessionHistory, setSessionHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Dynamic therapy type ID
    const [therapyId, setTherapyId] = useState(null);

    useEffect(() => {
        getTherapyType()
            .then(res => {
                if (res.data) {
                    // แยก ID ตามข้าง: ขวา (19), ซ้าย (20) สำหรับ Elbow Rotation
                    const targetSlug = selectedArm === 'right' ? 'elbow-rotation-right' : 'elbow-rotation-left';
                    const mode = res.data.find(m => m.slug === targetSlug || (m.slug === 'elbow-rotation' && selectedArm === 'right'));
                    
                    if (mode) {
                        setTherapyId(mode.id);
                    } else {
                        // fallback ถ้าหา slug แยกข้างไม่เจอ ให้ใช้ ID จาก ROM Test (19, 20)
                        setTherapyId(selectedArm === 'right' ? 19 : 20);
                    }
                }
            })
            .catch(err => {
                console.error("Error fetching therapy type:", err);
                setTherapyId(selectedArm === 'right' ? 19 : 20);
            });
    }, [selectedArm]);

    // Format time for display (MM:SS)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    // Handle opening the settings modal
    const handleOpenModal = () => {
        setModalTargetCount("");
        setModalSelectedArm(selectedArm);
        setIsModalOpen(true);
    };

    // Handle closing the settings modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Handle confirming settings
    const handleConfirmSettings = () => {
        const count = parseInt(modalTargetCount) || 0;

        if (count <= 0) {
            return;
        }

        setTargetCount(count);
        setSelectedArm(modalSelectedArm);
        setTimeElapsed(0);
        setCurrentCount(0);
        setIsConfigured(true);
        setIsFinished(false);
        isProcessingFinish.current = false;
        setIsModalOpen(false);
    };

    // Handle start button
    const handleStart = () => {
        if (isRunning) return;

        setCurrentCount(0);
        setTimeElapsed(0);
        isProcessingFinish.current = false;

        if (mediapipeRef.current) {
            mediapipeRef.current.resetCount();
        }

        setIsCountdown(true);
        setCountdownValue(3);
    };

    // Countdown effect (3-2-1)
    useEffect(() => {
        if (isCountdown && countdownValue > 0) {
            countdownIntervalRef.current = setTimeout(() => {
                setCountdownValue((prev) => prev - 1);
            }, 1000);
        } else if (isCountdown && countdownValue === 0) {
            setIsCountdown(false);

            if (mediapipeRef.current) {
                const success = mediapipeRef.current.lockCurrentPerson();
                if (success) {
                    setIsTracking(true);
                    setIsRunning(true);
                }
            }
        }

        return () => {
            if (countdownIntervalRef.current) {
                clearTimeout(countdownIntervalRef.current);
            }
        };
    }, [isCountdown, countdownValue]);

    // Handle finishing the exercise
    const handleFinish = useCallback(async () => {
        if (isProcessingFinish.current) return;
        isProcessingFinish.current = true;

        setIsRunning(false);
        setIsTracking(false);

        const count = mediapipeRef.current?.getArmRaiseCount() || currentCount;
        const usedTime = timeElapsed;
        const finalAvgAngle = mediapipeRef.current?.getAverageAngle() || 0;
        const finalMaxAngle = mediapipeRef.current?.getAngle() || 0;

        setFinalCount(count);
        setFinalTime(usedTime);
        setAvgAngle(finalAvgAngle);

        if (mediapipeRef.current) {
            mediapipeRef.current.unlockPerson();
        }

        const newSession = {
            id: Date.now(),
            timestamp: new Date(),
            duration: usedTime,
            count: count,
            targetCount: targetCount,
            success: count >= targetCount,
            note: count >= targetCount ? "สำเร็จตามเป้าหมาย!" : "สิ้นสุดการฝึก",
            avgAngle: finalAvgAngle,
            maxAngle: finalMaxAngle,
            armType: selectedArm
        };
        setSessionHistory((prev) => [newSession, ...prev]);

        setIsFinished(true);

        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const data = {
                userId: user.id,
                therapyTypesId: therapyId,
                patientId: parseInt(patientId),
                score: count,
                // time: usedTime,
                angle: finalAvgAngle, // Save average instead of max
            };
            console.log("Saving therapy history:", data);
            await addTherapyHistory(data);
        } catch (error) {
            console.error("Error saving therapy history:", error);
        }

        // Auto transition for routine mode
        if (isRoutineMode && onComplete) {
            setTimeout(() => {
                onComplete({ count, time: usedTime });
            }, 2000); // 2 second delay to see the result
        }
    }, [currentCount, timeElapsed, targetCount, patientId, isRoutineMode, onComplete, therapyId]);

    // Time elapsed effect
    useEffect(() => {
        if (isRunning) {
            timerIntervalRef.current = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);

                if (mediapipeRef.current) {
                    const count = mediapipeRef.current.getArmRaiseCount();
                    setCurrentCount(count);

                    if (count >= targetCount) {
                        clearInterval(timerIntervalRef.current);
                        handleFinish();
                    }
                }
            }, 1000);
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isRunning, targetCount, handleFinish]);

    // Handle stop button
    const handleStop = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        handleFinish();
    };

    // Handle close result modal
    const handleCloseResult = () => {
        setIsFinished(false);
        setCurrentCount(0);
        setTimeElapsed(0);
    };

    return (
        <div className="w-full h-[calc(100vh-73px)] flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center bg-[#F3FBFC] overflow-hidden relative">
                <div className="w-full h-full flex items-center justify-center">
                    <Mediapipe
                        ref={mediapipeRef}
                        mode="solo"
                        enableCounting={true}
                        angleThreshold={threshold}
                        trackingMode={trackingMode}
                        trackedSide={selectedArm}
                        onAngleUpdate={(angles) => setCurrentRealtimeAngle(Math.round(angles.max || 0))}
                    />
                </div>

                {isConfigured && !isCountdown && (
                    <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 min-w-[160px]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-[#F0E8FF] rounded-full flex items-center justify-center text-xl">
                                ⏱️
                            </div>
                            <div>
                                <div className="text-sm text-[#7E8C94]">เวลาที่ใช้</div>
                                <div className="text-2xl font-bold text-[#344054]">
                                    {formatTime(timeElapsed)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                            <div className="w-10 h-10 bg-[#FFF4E5] rounded-full flex items-center justify-center text-xl">
                                🎯
                            </div>
                            <div>
                                <div className="text-sm text-[#7E8C94]">องศาปัจจุบัน / เป้าหมาย</div>
                                <div className="text-2xl font-bold text-[#FF9500]">
                                    {currentRealtimeAngle}° <span className="text-lg text-[#7E8C94] font-normal">/ {threshold}°</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                            <div className="w-10 h-10 bg-[#E8F8FA] rounded-full flex items-center justify-center text-xl">
                                🔢
                            </div>
                            <div>
                                <div className="text-sm text-[#7E8C94]">จำนวนครั้ง</div>
                                <div className="text-2xl font-bold text-[#40C9D5]">
                                    {currentCount}{" "}
                                    <span className="text-lg text-[#7E8C94] font-normal">
                                        / {targetCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isCountdown && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="text-center">
                            <div className="text-[150px] font-bold text-white drop-shadow-2xl animate-bounce">
                                {countdownValue}
                            </div>
                            <div className="text-2xl text-white/80 mt-4">เตรียมตัว...</div>
                        </div>
                    </div>
                )}

                {isFinished && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-[fadeIn_0.3s_ease-out]">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-[#E8F8FA] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                                    {finalCount >= targetCount ? "🎉" : "⏰"}
                                </div>
                                <h2 className="text-2xl font-bold text-[#344054]">
                                    {finalCount >= targetCount ? "ยอดเยี่ยม!" : "หมดเวลา!"}
                                </h2>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="bg-[#F3FBFC] rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#FFF4E5] rounded-full flex items-center justify-center text-2xl">
                                        🎯
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#7E8C94]">
                                            ค่าเฉลี่ยองศาที่ทำได้
                                        </div>
                                        <div className="text-xl font-bold">
                                            <span
                                                className={
                                                    avgAngle >= threshold
                                                        ? "text-blue-500"
                                                        : avgAngle >= threshold - 15 
                                                            ? "text-green-500" 
                                                            : "text-orange-500"
                                                }
                                            >
                                                {avgAngle}°
                                            </span>
                                            <span className="text-[#7E8C94] font-normal text-sm ml-1">
                                                (เป้าหมาย {threshold}°)
                                            </span>
                                            <div className="text-sm mt-0.5 font-medium">
                                                {avgAngle >= threshold ? (
                                                    <span className="text-blue-500">🎉 สุดยอด! ดีกว่าเป้าหมาย</span>
                                                ) : avgAngle >= threshold - 15 ? (
                                                    <span className="text-green-500">👍 เยี่ยมมาก! เกือบทะลุเป้า</span>
                                                ) : (
                                                    <span className="text-orange-500">💪 พยายามอีกนิดนึงนะ สู้ๆ!</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#F3FBFC] rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#E8F8FA] rounded-full flex items-center justify-center text-2xl">
                                        🔢
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#7E8C94]">
                                            จำนวนครั้งที่ได้
                                        </div>
                                        <div className="text-xl font-bold">
                                            <span
                                                className={
                                                    finalCount >= targetCount
                                                        ? "text-green-500"
                                                        : "text-orange-500"
                                                }
                                            >
                                                {finalCount}
                                            </span>
                                            <span className="text-[#7E8C94] font-normal">
                                                {" "}
                                                / {targetCount} ครั้ง
                                            </span>
                                            {finalCount > targetCount && (
                                                <span className="text-green-500 text-sm ml-2">
                                                    (+{finalCount - targetCount} ครั้ง!)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#F3FBFC] rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#F0E8FF] rounded-full flex items-center justify-center text-2xl">
                                        ⏱️
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#7E8C94]">เวลาที่ใช้ทั้งหมด</div>
                                        <div className="text-xl font-bold text-[#344054]">
                                            {formatTime(finalTime)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCloseResult}
                                className="w-full py-3 bg-[#40C9D5] text-white font-semibold rounded-xl hover:bg-[#2BA8B4] transition shadow-md"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 invisible">
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-[fadeIn_0.3s_ease-out]">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-[#F0E8FF] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                ⚙️
                            </div>
                            <h2 className="text-2xl font-bold text-[#344054]">
                                ตั้งเป้าหมาย
                            </h2>
                            <p className="text-[#7E8C94] mt-1">
                                กำหนดจำนวนครั้งเป้าหมายสำหรับการฝึกนี้
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[#344054] mb-2">
                                เลือกแขนที่ต้องการฝึก
                            </label>
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${modalSelectedArm === 'left' ? 'bg-white shadow text-[#40C9D5]' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setModalSelectedArm('left')}
                                >
                                    แขนซ้าย
                                </button>
                                <button
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${modalSelectedArm === 'right' ? 'bg-white shadow text-[#40C9D5]' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setModalSelectedArm('right')}
                                >
                                    แขนขวา
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[#344054] mb-2">
                                จำนวนครั้งเป้าหมาย
                            </label>
                            <input
                                type="number"
                                value={modalTargetCount}
                                onChange={(e) => setModalTargetCount(e.target.value)}
                                placeholder="กรอกจำนวนครั้ง"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent text-lg"
                                min="1"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-3 border border-gray-200 text-[#7E8C94] font-semibold rounded-xl hover:bg-gray-50 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirmSettings}
                                disabled={!modalTargetCount}
                                className={`flex-1 py-3 font-semibold rounded-xl transition shadow-md ${modalTargetCount
                                    ? "bg-[#40C9D5] text-white hover:bg-[#2BA8B4]"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-8 py-4 flex-shrink-0">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleOpenModal}
                            disabled={isRunning || isCountdown}
                            className={`px-5 py-3 font-semibold rounded-xl transition flex items-center gap-2 ${isRunning || isCountdown
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-[#F0E8FF] text-[#8B5CF6] hover:bg-[#E5DEFF]"
                                }`}
                        >
                            <span className="text-lg">⚙️</span>
                            ตั้งเป้าหมาย
                        </button>

                        <div className="w-px h-10 bg-gray-200"></div>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#F0E8FF] rounded-full flex items-center justify-center text-2xl">
                                ⏱️
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-[#344054] text-lg">
                                    {modeTitle}
                                </span>
                                {isTracking && (
                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        กำลังนับจำนวนครั้ง
                                    </span>
                                )}
                                {!isTracking && isConfigured && (
                                    <span className="text-sm text-[#7E8C94]">
                                        เป้าหมาย: {targetCount} ครั้ง
                                    </span>
                                )}
                                {!isConfigured && (
                                    <span className="text-sm text-orange-500">
                                        ยังไม่ได้ตั้งค่า
                                    </span>
                                )}
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
                            onClick={isRunning ? handleStop : handleStart}
                            disabled={!isConfigured || isCountdown}
                            className={`px-8 py-3 font-semibold rounded-lg transition shadow-md min-w-[120px] ${!isConfigured || isCountdown
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : isRunning
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : "bg-[#40C9D5] text-white hover:bg-[#2BA8B4]"
                                }`}
                        >
                            {isRunning ? "หยุด" : "เริ่ม"}
                        </button>
                    </div>
                </div>
            </div>

            <ExerciseHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                history={sessionHistory}
                exerciseName={modeTitle}
                exerciseIcon="⏱️"
            />
        </div>
    );
}
