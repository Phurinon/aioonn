import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Import all exercise components
import ShoulderFlexion from "../Active/ShoulderFlexion";
import ShoulderAbduction from "../Active/ShoulderAbduction";
import ElbowRotation from "../Active/ElbowRotation";
import Balance from "../Passive/Balance";
import Standing from "../Passive/Standing";
import MusleTraining from "./MusleTraining";
import Stretching from "./Stretching";

const API_URL = import.meta.env.VITE_API_URL;

export default function RoutineRunner() {
    const { patientId, routineId } = useParams();
    const navigate = useNavigate();
    const [routine, setRoutine] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        const fetchRoutine = async () => {
            try {
                const response = await axios.get(`${API_URL}/routines/${routineId}`);
                // Sort steps by order
                const sortedSteps = response.data.steps.sort((a, b) => a.order - b.order);
                setRoutine({ ...response.data, steps: sortedSteps });
                setLoading(false);
            } catch (err) {
                console.error("Error fetching routine:", err);
                setError("ไม่สามารถโหลดข้อมูลรูทีนได้");
                setLoading(false);
            }
        };

        fetchRoutine();
    }, [routineId]);

    const handleStepComplete = useCallback((result) => {
        console.log(`Step ${currentStepIndex} completed with result:`, result);

        if (currentStepIndex < routine.steps.length - 1) {
            // Move to next step
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // Routine finished
            setIsFinished(true);
        }
    }, [currentStepIndex, routine]);

    if (loading) return <div className="flex items-center justify-center h-screen font-bold text-xl">กำลังเตรียมระบบกรูทีน...</div>;
    if (error) return <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate("/routine/list")} className="px-4 py-2 bg-[#40C9D5] text-white rounded-lg">กลับหน้าหลัก</button>
    </div>;

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-73px)] bg-[#F3FBFC]">
                <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full">
                    <div className="text-6xl mb-6">🎉</div>
                    <h1 className="text-3xl font-bold text-[#344054] mb-2">ยินดีด้วย!</h1>
                    <p className="text-[#7E8C94] mb-8 text-lg">คุณทำรูทีน "{routine.name}" ครบทุกขั้นตอนแล้ว</p>
                    <button
                        onClick={() => navigate(`/activity/${patientId}/routine/list`)}
                        className="w-full py-4 bg-[#40C9D5] text-white font-bold rounded-2xl hover:bg-[#2BA8B4] transition shadow-lg text-lg"
                    >
                        กลับสู่รายการรูทีน
                    </button>
                </div>
            </div>
        );
    }

    const currentStep = routine.steps[currentStepIndex];
    if (!currentStep) return null;

    // Map therapyTypeId to component
    // Assuming IDs mapped in fix_therapy_names.js:
    // 1: Shoulder Flexion
    // 2: Shoulder Abduction
    // 3: Elbow Rotation
    // 4: Balance
    // 5: Standing
    // 6: Muscle Training
    // 7: Stretching

    const renderExercise = () => {
        const props = {
            key: currentStepIndex,
            isRoutineMode: true,
            autoStart: currentStepIndex > 0,
            presetTargetCount: currentStep.targetCount,
            presetTimerDuration: currentStep.targetTime,
            presetTargetTime: currentStep.targetTime,
            onComplete: handleStepComplete
        };

        switch (parseInt(currentStep.therapyTypeId)) {
            case 1: return <ShoulderFlexion {...props} />;
            case 2: return <ShoulderAbduction {...props} />;
            case 3: return <ElbowRotation {...props} />;
            case 4: return <Balance {...props} />;
            case 5: return <Standing {...props} />;
            case 6: return <MusleTraining {...props} />;
            case 7: return <Stretching {...props} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-red-500 mb-4">ไม่พบท่าทางการฝึก (ID: {currentStep.therapyTypeId})</p>
                        <button onClick={handleStepComplete} className="px-6 py-2 bg-[#40C9D5] text-white rounded-lg">ข้ามท่านี้</button>
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-[calc(100vh-73px)] bg-gray-50 flex flex-col">
            {/* Header / Progress bar */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="font-bold text-[#344054]">{routine.title}</h2>
                        <p className="text-xs text-[#7E8C94]">ขั้นตอนที่ {currentStepIndex + 1} จาก {routine.steps.length}</p>
                    </div>
                </div>

                <div className="flex-1 max-w-md mx-8">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#40C9D5] transition-all duration-500"
                            style={{ width: `${((currentStepIndex) / routine.steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bg-[#E8F8FA] px-4 py-1.5 rounded-full text-[#40C9D5] text-sm font-bold">
                    {Math.round(((currentStepIndex) / routine.steps.length) * 100)}%
                </div>
            </div>

            {/* Exercise Area */}
            <div className="flex-1 relative">
                {renderExercise()}

                {/* Step Overlays / Controls if needed */}
                <div className="absolute top-4 left-4 z-[60]">
                    <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50">
                        <span className="text-xs font-bold text-[#7E8C94] uppercase tracking-wider block mb-1">ท่าปัจจุบัน</span>
                        <span className="text-lg font-bold text-[#40C9D5]">{currentStep.therapyType?.title || "กำลังฝึก..."}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
