import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getRoutineById } from "../../Functions/routine";

// Import all exercise components
import ShoulderFlexion from "../Active/ShoulderFlexion";
import ShoulderAbduction from "../Active/ShoulderAbduction";
import ElbowRotation from "../Active/ElbowRotation";
import Balance from "../Passive/Balance";
import Standing from "../Passive/Standing";
import MusleTraining from "./MusleTraining";
import Stretching from "./Stretching";

export default function RoutineRunner() {
    const { patientId, routineId } = useParams();
    const navigate = useNavigate();
    const [routine, setRoutine] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [stepResults, setStepResults] = useState([]);

    useEffect(() => {
        const fetchRoutine = async () => {
            try {
                const response = await getRoutineById(routineId)
                // Sort steps by order
                const sortedSteps = response.steps.sort((a, b) => a.order - b.order);
                setRoutine({ ...response, steps: sortedSteps });
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
        const currentStep = routine.steps[currentStepIndex];
        const stepName = currentStep.therapyType?.title || "ไม่ทราบชื่อท่า";
        
        const sideText = currentStep.side === 'left' ? 'ด้านซ้าย' : 'ด้านขวา';
        const formattedTitle = stepName.includes(')') 
            ? stepName.replace(')', sideText + ')') 
            : `${stepName} (${sideText})`;

        // Add result to array
        setStepResults(prev => [...prev, {
            title: formattedTitle,
            count: result.count,
            time: result.time,
            maxAngle: result.maxAngle,
            avgAngle: result.avgAngle
        }]);

        if (currentStepIndex < routine.steps.length - 1) {
            // Move to next step with transition
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStepIndex(prev => prev + 1);
                setIsTransitioning(false);
            }, 3000); // 3-second transition
        } else {
            // Routine finished
            setIsFinished(true);
        }
    }, [currentStepIndex, routine]);

    const handleRestart = () => {
        setCurrentStepIndex(0);
        setStepResults([]);
        setIsFinished(false);
        setIsTransitioning(false);
    };

    if (loading) return <div className="flex items-center justify-center h-screen font-bold text-xl">กำลังเตรียมระบบกรูทีน...</div>;
    if (error) return <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate("/routine/list")} className="px-4 py-2 bg-[#40C9D5] text-white rounded-lg">กลับหน้าหลัก</button>
    </div>;

    const currentStep = routine.steps[currentStepIndex];
    if (!currentStep) return null;

    // Map therapyType slug to component
    // slugs from database:
    // "shoulder-flexion": Shoulder Flexion
    // "shoulder-abduction": Shoulder Abduction
    // "elbow-rotation": Elbow Rotation
    // "balance": Balance
    // "posture": Standing
    // "muscle-training": Muscle Training (or similar, if preset)
    // "stretching": Stretching (or similar, if preset)

    const renderExercise = () => {
        const props = {
            key: currentStepIndex,
            isRoutineMode: true,
            isTransitioning: isTransitioning,
            autoStart: currentStepIndex > 0,
            presetTargetCount: currentStep.targetCount,
            presetSide: currentStep.side || "right",
            onComplete: handleStepComplete,
            routineResults: stepResults
        };

        const slug = currentStep.therapyType?.slug;

        switch (slug) {
            case "shoulder-flexion": return <ShoulderFlexion {...props} />;
            case "shoulder-abduction": return <ShoulderAbduction {...props} />;
            case "elbow-rotation": return <ElbowRotation {...props} />;
            case "balance": return <Balance {...props} />;
            case "posture": return <Standing {...props} />;
            // Future additions for preset category if needed:
            // case "muscle-training": return <MusleTraining {...props} />;
            // case "stretching": return <Stretching {...props} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-red-500 mb-4">ไม่พบท่าทางการฝึก (Slug: {slug || currentStep.therapyTypeId})</p>
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

                {/* Congratulations Overlay */}
                {isFinished && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] animate-in fade-in duration-300">
                        <div className="bg-white p-6 rounded-[32px] shadow-2xl text-center max-w-md w-full mx-4 border border-white/20 transform animate-in zoom-in-95 duration-300">
                            <div className="text-5xl mb-3">🏆</div>
                            <h1 className="text-2xl font-black text-[#344054] mb-1">สรุปผลการฝึก</h1>
                            <p className="text-[#7E8C94] mb-4 text-sm font-bold">โปรแกรม: {routine.title}</p>
                            
                            <div className="max-h-[220px] overflow-y-auto mb-5 space-y-2 pr-1 scrollbar-hide">
                                {stepResults.map((res, idx) => (
                                    <div key={idx} className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100/50 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <div className="text-[#344054] font-bold text-base">{res.title}</div>
                                            <div className="text-xl font-black text-[#40C9D5]">{res.count} <span className="text-[10px] text-[#7E8C94] uppercase tracking-tighter">ครั้ง</span></div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100/30">
                                            <div className="flex gap-4">
                                                <div className="text-[11px] font-bold text-[#FF9500] bg-[#FFF4E5] px-2 py-0.5 rounded-full">สูงสุด: {res.maxAngle}°</div>
                                                <div className="text-[11px] font-bold text-[#40C9D5] bg-[#E8F8FA] px-2 py-0.5 rounded-full">เฉลี่ย: {res.avgAngle}°</div>
                                            </div>
                                            <div className="text-[10px] text-[#7E8C94] font-medium">{Math.floor(res.time / 60)}:{(res.time % 60).toString().padStart(2, '0')} น.</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button
                                onClick={handleRestart}
                                className="w-full py-4 bg-[#40C9D5] text-white font-bold rounded-2xl hover:bg-[#2BA8B4] transition-all active:scale-[0.98] shadow-lg text-lg"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
