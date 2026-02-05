import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Mediapipe from "../components/Mediapipe";
import { addTherapyHistory } from "../Functions/therapy";
import ExerciseHistoryModal from "../components/ExerciseHistoryModal";
import usePatientLevelThreshold from "../hooks/usePatientLevelThreshold";

export default function TimerCountArmRaise() {
  const { patientId } = useParams();
  const mediapipeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isProcessingFinish = useRef(false);

  // Settings
  const threshold = usePatientLevelThreshold(patientId);

  // Configuration states
  const [isConfigured, setIsConfigured] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0); // in seconds
  const [targetCount, setTargetCount] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTimeMinutes, setModalTimeMinutes] = useState(""); // นาที
  const [modalTimeSeconds, setModalTimeSeconds] = useState(""); // วินาที (0-59)
  const [modalTargetCount, setModalTargetCount] = useState("");

  // Running states
  const [isTracking, setIsTracking] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);

  // Finish states
  const [isFinished, setIsFinished] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [finalCount, setFinalCount] = useState(0);

  // Session history state (ยังไม่มีข้อมูลจริง จะแสดง empty state)
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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
    setModalTimeMinutes("");
    setModalTimeSeconds("");
    setModalTargetCount("");
    setIsModalOpen(true);
  };

  // Handle closing the settings modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle confirming settings
  const handleConfirmSettings = () => {
    const minutes = parseInt(modalTimeMinutes) || 0;
    const seconds = parseInt(modalTimeSeconds) || 0;
    const count = parseInt(modalTargetCount) || 0;

    // ต้องมีเวลาอย่างน้อย 1 วินาที และจำนวนครั้ง > 0
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds < 1 || count <= 0) {
      return;
    }

    setTimerDuration(totalSeconds);
    setTargetCount(count);
    setTimeLeft(totalSeconds);
    setCurrentCount(0);
    setIsConfigured(true);
    setIsFinished(false);
    isProcessingFinish.current = false;
    setIsModalOpen(false);
  };

  // Handle time input changes - remove leading zeros
  const handleMinutesChange = (e) => {
    const value = e.target.value;
    const cleaned = value.replace(/^0+/, "") || "";
    if (cleaned.length <= 2) {
      setModalTimeMinutes(cleaned);
    }
  };

  const handleSecondsChange = (e) => {
    const value = e.target.value;
    const cleaned = value.replace(/^0+/, "") || "";
    const num = parseInt(cleaned) || 0;
    // จำกัด 0-59 วินาที
    if (num <= 59 && cleaned.length <= 2) {
      setModalTimeSeconds(cleaned);
    }
  };

  // Handle start button
  const handleStart = () => {
    if (!isConfigured || isRunning) return;

    // Reset count
    setCurrentCount(0);
    setTimeLeft(timerDuration);
    isProcessingFinish.current = false;

    // Reset Mediapipe count
    if (mediapipeRef.current) {
      mediapipeRef.current.resetCount();
    }

    // Start countdown
    setIsCountdown(true);
    setCountdownValue(3);
  };

  // Handle finishing the exercise
  // const handleFinishHistory = useCallback(async () => {
  //   setIsRunning(false);
  //   setIsTracking(false);

  //   // Get final count
  //   const count = mediapipeRef.current?.getArmRaiseCount() || currentCount;
  //   setFinalCount(count);
  //   const timeUsed = timerDuration - timeLeft;
  //   setFinalTime(timeUsed);

  //   // Unlock person
  //   if (mediapipeRef.current) {
  //     mediapipeRef.current.unlockPerson();
  //   }

  //   setIsFinished(true);

  //   try {
  //     const user = JSON.parse(localStorage.getItem("user") || "{}");
  //     const data = {
  //       userId: user.id,
  //       therapyTypesId: 6,
  //       patientId: parseInt(patientId),
  //       scoreRound1: count,
  //       timeRound1: timeUsed + 1,
  //     };
  //     console.log("Saving therapy history:", data);
  //     await addTherapyHistory(data);
  //   } catch (error) {
  //     console.error("Error saving therapy history:", error);
  //   }
  // }, [currentCount, timerDuration, timeLeft]);

  // Countdown effect (3-2-1)
  useEffect(() => {
    if (isCountdown && countdownValue > 0) {
      countdownIntervalRef.current = setTimeout(() => {
        setCountdownValue((prev) => prev - 1);
      }, 1000);
    } else if (isCountdown && countdownValue === 0) {
      // Countdown finished, start the actual timer
      setIsCountdown(false);

      // Lock person and start tracking
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

    // Get final count
    const count = mediapipeRef.current?.getArmRaiseCount() || currentCount;
    const usedTime = timerDuration - timeLeft;

    setFinalCount(count);
    setFinalTime(usedTime);

    // Unlock person
    if (mediapipeRef.current) {
      mediapipeRef.current.unlockPerson();
    }

    // บันทึกประวัติ session
    const newSession = {
      id: Date.now(),
      timestamp: new Date(),
      duration: usedTime + 1,
      targetDuration: timerDuration,
      count: count,
      targetCount: targetCount,
      success: count >= targetCount,
      note: count >= targetCount ? "สำเร็จตามเป้าหมาย!" : "พยายามต่อไป",
    };
    setSessionHistory((prev) => [newSession, ...prev]);

    setIsFinished(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const data = {
        userId: user.id,
        therapyTypesId: 4,
        patientId: parseInt(patientId),
        score: count,
        time: usedTime + 1,
        angle: mediapipeRef.current.getAngle(),
      };
      console.log("Saving therapy history:", data);
      await addTherapyHistory(data);
    } catch (error) {
      console.error("Error saving therapy history:", error);
    }
  }, [currentCount, timerDuration, timeLeft, targetCount]);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up
            clearInterval(timerIntervalRef.current);
            // handleFinishHistory();
            handleFinish();
            return 0;
          }
          return prev - 1;
        });

        // Update current count from Mediapipe
        if (mediapipeRef.current) {
          const count = mediapipeRef.current.getArmRaiseCount();
          setCurrentCount(count);

          // Check if target reached
          if (count >= targetCount) {
            clearInterval(timerIntervalRef.current);
            // handleFinishHistory();
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
  }, [isRunning, timeLeft, targetCount]);

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
    setTimeLeft(timerDuration);
  };

  return (
    <div className="w-full h-[calc(100vh-73px)] flex flex-col overflow-hidden">
      {/* Main camera area */}
      <div className="flex-1 flex items-center justify-center bg-[#F3FBFC] overflow-hidden relative">
        {/* Mediapipe component */}
        <div className="w-full h-full flex items-center justify-center">
          <Mediapipe 
            ref={mediapipeRef} 
            mode="solo" 
            enableCounting={true} 
            angleThreshold={threshold} 
          />
        </div>

        {/* Timer and Count Display - Top Right */}
        {isConfigured && !isCountdown && (
          <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 min-w-[160px]">
            {/* Timer */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#F0E8FF] rounded-full flex items-center justify-center text-xl">
                ⏱️
              </div>
              <div>
                <div className="text-sm text-[#7E8C94]">เวลาที่เหลือ</div>
                <div
                  className={`text-2xl font-bold ${
                    timeLeft <= 10 && isRunning
                      ? "text-red-500 animate-pulse"
                      : "text-[#344054]"
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Count */}
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

        {/* Countdown Overlay (3-2-1) */}
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

        {/* Result Modal */}
        {isFinished && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-[fadeIn_0.3s_ease-out]">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-[#E8F8FA] rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                  {finalCount >= targetCount ? "🎉" : "⏰"}
                </div>
                <h2 className="text-2xl font-bold text-[#344054]">
                  {finalCount >= targetCount ? "ยอดเยี่ยม!" : "หมดเวลา!"}
                </h2>
              </div>

              {/* Stats */}
              <div className="space-y-4 mb-6">
                {/* Time Used */}
                <div className="bg-[#F3FBFC] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F0E8FF] rounded-full flex items-center justify-center text-2xl">
                    ⏱️
                  </div>
                  <div>
                    <div className="text-sm text-[#7E8C94]">เวลาที่ใช้</div>
                    <div className="text-xl font-bold text-[#344054]">
                      {formatTime(timerDuration - timeLeft)} /{" "}
                      {formatTime(timerDuration)}
                    </div>
                  </div>
                </div>

                {/* Count Result */}
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
              </div>

              {/* Close Button */}
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

      {/* Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-[fadeIn_0.3s_ease-out]">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#F0E8FF] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ⚙️
              </div>
              <h2 className="text-2xl font-bold text-[#344054]">
                ตั้งค่าการจับเวลา
              </h2>
              <p className="text-[#7E8C94] mt-1">
                กำหนดเวลาและจำนวนครั้งเป้าหมาย
              </p>
            </div>

            {/* Time Input - นาที : วินาที */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#344054] mb-3">
                เวลาที่ต้องการ
              </label>
              <div className="flex items-center justify-center gap-2">
                {/* Minutes input */}
                <input
                  type="number"
                  value={modalTimeMinutes}
                  onChange={handleMinutesChange}
                  placeholder="0"
                  className="w-20 px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent text-2xl text-center font-bold"
                  min="0"
                  max="99"
                />
                {/* Unit */}
                <span className="text-lg font-medium text-[#7E8C94]">นาที</span>
                {/* Colon separator */}
                <span className="text-3xl font-bold text-[#344054]">:</span>
                {/* Seconds input */}
                <input
                  type="number"
                  value={modalTimeSeconds}
                  onChange={handleSecondsChange}
                  placeholder="0"
                  className="w-20 px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40C9D5] focus:border-transparent text-2xl text-center font-bold"
                  min="0"
                  max="59"
                />
                {/* Unit */}
                <span className="text-lg font-medium text-[#7E8C94]">
                  วินาที
                </span>
              </div>
              <p className="text-center text-sm text-[#7E8C94] mt-2">
                รวม:{" "}
                {(parseInt(modalTimeMinutes) || 0) * 60 +
                  (parseInt(modalTimeSeconds) || 0)}{" "}
                วินาที
              </p>
            </div>

            {/* Target Count Input */}
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

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 border border-gray-200 text-[#7E8C94] font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmSettings}
                disabled={
                  (!modalTimeMinutes && !modalTimeSeconds) || !modalTargetCount
                }
                className={`flex-1 py-3 font-semibold rounded-xl transition shadow-md ${
                  (modalTimeMinutes || modalTimeSeconds) && modalTargetCount
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

      {/* Bottom bar */}
      <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-8 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          {/* Left side - Settings button + Mode info */}
          <div className="flex items-center gap-4">
            {/* Settings Button */}
            <button
              onClick={handleOpenModal}
              disabled={isRunning || isCountdown}
              className={`px-5 py-3 font-semibold rounded-xl transition flex items-center gap-2 ${
                isRunning || isCountdown
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#F0E8FF] text-[#8B5CF6] hover:bg-[#E5DEFF]"
              }`}
            >
              <span className="text-lg">⚙️</span>
              ตั้งเวลา
            </button>

            {/* Divider */}
            <div className="w-px h-10 bg-gray-200"></div>

            {/* Mode info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F0E8FF] rounded-full flex items-center justify-center text-2xl">
                ⏱️
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[#344054] text-lg">
                  จับเวลา
                </span>
                {isTracking && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    กำลังนับจำนวนครั้ง
                  </span>
                )}
                {!isTracking && isConfigured && (
                  <span className="text-sm text-[#7E8C94]">
                    {formatTime(timerDuration)} • {targetCount} ครั้ง
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

          {/* Right side - Action buttons */}
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
              className={`px-8 py-3 font-semibold rounded-lg transition shadow-md min-w-[120px] ${
                !isConfigured || isCountdown
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

      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={sessionHistory}
        exerciseName="จับเวลา"
        exerciseIcon="⏱️"
      />
    </div>
  );
}
