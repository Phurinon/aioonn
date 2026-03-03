import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Mediapipe from '../components/Mediapipe';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { getTherapyType, addTherapyHistory } from '../Functions/therapy';
import Swal from 'sweetalert2';

export default function DailyRomTesting() {
    const navigate = useNavigate();
    const { patientId } = useParams();
    const mediapipeRef = useRef(null);

    // Check if test is already done
    useEffect(() => {
        const lastTestTime = localStorage.getItem(`lastDailyRomTest_${patientId}`);
        const now = Date.now();
        const oneMinute = 60 * 1000; // 1 minute for testing

        if (lastTestTime && (now - parseInt(lastTestTime) <= oneMinute)) {
            navigate(`/select-category/${patientId}`, { replace: true });
        }
    }, [patientId, navigate]);

    // Steps state from DB
    const [steps, setSteps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDailySteps = async () => {
            try {
                const response = await getTherapyType();
                const dailyTherapies = response.data.filter(t => t.category === 'daily' || t.category === 'Daily');
                
                const mappedSteps = dailyTherapies.map((t) => {
                    const slug = (t.slug || t.title || '').toLowerCase();
                    let side = 'Right';
                    if (slug.includes('left') || slug.includes('ซ้าย')) side = 'Left';
                    
                    let action = 'Flexion';
                    if (slug.includes('abduction') || slug.includes('กาง')) action = 'Abduction';
                    if (slug.includes('external') || slug.includes('หมุน')) action = 'ExternalRotation';

                    return {
                        id: t.id,
                        name: t.title, // Use title from DB
                        title: t.title,
                        description: t.description || "",
                        side,
                        action
                    };
                });
                
                setSteps(mappedSteps);
            } catch (error) {
                console.error("Failed to fetch daily ROM therapies:", error);
                setSteps([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDailySteps();
    }, []);

    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // States
    const [status, setStatus] = useState('INSTRUCTION');
    const [timer, setTimer] = useState(0);
    const [results, setResults] = useState({});
    const [currentAngle, setCurrentAngle] = useState(0);
    const [recordedAnglesForStep, setRecordedAnglesForStep] = useState([]);

    // Refs for consistent access inside callbacks
    const statusRef = useRef(status);
    const recordedAnglesRef = useRef(recordedAnglesForStep);
    const currentStepIndexRef = useRef(currentStepIndex);
    const stepsRef = useRef(steps);

    // Sync refs with state
    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { recordedAnglesRef.current = recordedAnglesForStep; }, [recordedAnglesForStep]);
    useEffect(() => { currentStepIndexRef.current = currentStepIndex; }, [currentStepIndex]);
    useEffect(() => { stepsRef.current = steps; }, [steps]);

    // Stable callback using Refs to avoid stale closures
    const handleAngleUpdate = useCallback((angles) => {
        const currentSteps = stepsRef.current;
        const currentIndex = currentStepIndexRef.current;
        const currentStep = currentSteps[currentIndex];

        if (!currentStep) return;

        let angleToTrack = 0;
        let isConstraintMet = true;

        if (currentStep.action === 'ExternalRotation') {
            // External Rotation Logic:
            // 1. Forearm Angle: 0 (Down/Earth) to 180 (Up/Ceiling)
            // 2. Score: Inverted. Start (Up) = 0. End (Down) = 180.
            // Formula: Score = 180 - ForearmAngle (Clamped 0-180)

            const rawForearmAngle = currentStep.side === 'Right' ? angles.rightForearm : angles.leftForearm;
            let forearmAngle = (rawForearmAngle || 0) + 90; // Convert to 0-180 range
            if (forearmAngle < 0) forearmAngle = 0;
            if (forearmAngle > 180) forearmAngle = 180;

            // Calculate Score (Inverted)
            angleToTrack = 180 - forearmAngle;

            // Constraint: Shoulder Abduction must be 70-120 degrees
            const shoulderAngle = currentStep.side === 'Right' ? angles.right : angles.left;
            if (shoulderAngle < 70 || shoulderAngle > 120) {
                isConstraintMet = false;
                angleToTrack = 0; // Force 0 if constraint not met
            }

        } else {
            // Standard Flexion/Abduction Logic
            if (currentStep.side === 'Right') {
                angleToTrack = angles.right;
            } else {
                angleToTrack = angles.left;
            }
        }

        if (isNaN(angleToTrack)) return;

        const roundedAngle = Math.round(angleToTrack);
        setCurrentAngle(roundedAngle);

        // Using Ref to check status ensures we always have the live value
        if (statusRef.current === 'TESTING' && isConstraintMet && roundedAngle > 0) {
            setRecordedAnglesForStep(prev => [...prev, roundedAngle]);
        }
    }, []); // Empty dependencies = consistent reference across renders

    // Timer logic
    useEffect(() => {
        let interval = null;

        if (status === 'COUNTDOWN' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (status === 'COUNTDOWN' && timer === 0) {
            clearInterval(interval);
            setStatus('TESTING');
            setRecordedAnglesForStep([]);
        }

        return () => clearInterval(interval);
    }, [status, timer]);

    const getAverageAngle = () => {
        if (recordedAnglesForStep.length === 0) return 0;
        const sum = recordedAnglesForStep.reduce((a, b) => a + b, 0);
        return Math.round(sum / recordedAnglesForStep.length);
    };

    const handleNextStep = () => {
        const currentStep = steps[currentStepIndex];
        const averageAngle = getAverageAngle();

        setResults(prev => ({
            ...prev,
            [currentStep.id]: {
                ...currentStep,
                angle: averageAngle
            }
        }));

        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
            setCurrentAngle(0);
            setRecordedAnglesForStep([]);
            setStatus('INSTRUCTION');
        } else {
            setStatus('COMPLETED');
        }
    };

    const startCountdown = () => {
        if (mediapipeRef.current && currentStepIndex === 0) {
            mediapipeRef.current.lockCurrentPerson();
        }
        setStatus('COUNTDOWN');
        setTimer(3);
        setRecordedAnglesForStep([]);
    };

    const finishTest = async () => {
        try {
            // Get user ID from localStorage or fallback to patientId
            const userStr = localStorage.getItem("user");
            const userId = userStr ? JSON.parse(userStr).id : patientId;
            
            // Post each recorded step angle to the database
            const promises = Object.values(results).map(res => {
                return addTherapyHistory({
                    patientId: parseInt(patientId),
                    userId: parseInt(userId),
                    therapyTypesId: res.id,
                    time: 0,
                    score: 0,
                    weight: 0,
                    angle: res.angle || 0
                });
            });

            await Promise.all(promises);
            
            localStorage.setItem(`lastDailyRomTest_${patientId}`, Date.now().toString());
            
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                text: 'บันทึกการทดสอบรายวันลงฐานข้อมูลเรียบร้อยแล้ว',
                confirmButtonColor: '#40C9D5'
            }).then(() => {
                navigate(`/select-category/${patientId}`, { replace: true });
            });
            
        } catch (error) {
            console.error("Failed to save ROM test results:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้',
                confirmButtonColor: '#40C9D5'
            });
        }
    };

    const currentStep = steps.length > 0 ? steps[currentStepIndex] : null;

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-black flex items-center justify-center">
                <p className="text-white text-xl">กำลังโหลดข้อมูลการทดสอบ...</p>
            </div>
        );
    }

    if (steps.length === 0) {
        return (
            <div className="w-full min-h-screen bg-[#F3FBFC] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 shadow-lg max-w-2xl w-full text-center">
                    <h1 className="text-2xl font-bold text-[#344054] mb-4">ยังไม่มีท่าทดสอบ</h1>
                    <p className="text-gray-500 mb-6">กรุณาเพิ่ม Therapy Type หมวดหมู่ "Daily" ในหน้าจัดการแอดมิน</p>
                    <button
                        onClick={() => navigate(`/select-category/${patientId}`, { replace: true })}
                        className="bg-[#40C9D5] text-white px-8 py-3 rounded-full font-bold"
                    >
                        กลับ
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'COMPLETED') {
        return (
            <div className="w-full min-h-screen bg-[#F3FBFC] flex flex-col items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 shadow-lg max-w-2xl w-full text-center">
                    <h1 className="text-3xl font-bold text-[#344054] mb-6">สรุปผลการทดสอบ</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                        {steps.map(step => (
                            <div key={step.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="font-semibold text-[#101828]">{step.title}</p>
                                <p className="text-[#40C9D5] font-bold text-xl">
                                    {results[step.id]?.angle || 0}°
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={finishTest}
                        className="bg-[#40C9D5] hover:bg-[#32a8b3] text-white text-xl font-bold py-4 px-12 rounded-full transition-all transform hover:scale-105 shadow-md"
                    >
                        ตกลง
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-black flex flex-col relative overflow-hidden">

            {/* Mediapipe Background */}
            <div className="absolute inset-0 z-0">
                <Mediapipe
                    ref={mediapipeRef}
                    mode="solo"
                    enableCounting={false}
                    showCountOverlay={false}
                    onAngleUpdate={handleAngleUpdate}
                />
            </div>

            {/* Overlay UI */}
            <div className="relative z-10 w-full min-h-screen flex flex-col pointer-events-none">

                {/* Top Right: Compact Control Panel */}
                <div className="absolute top-4 right-4 pointer-events-auto flex flex-col gap-2 items-end">

                    {/* Angle Display */}
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg w-[160px] text-right">
                        <div className="mb-2">
                            <p className="text-xs text-gray-500 font-medium">ปัจจุบัน</p>
                            <p className="text-5xl font-bold text-[#40C9D5] leading-none">{currentAngle}°</p>
                        </div>
                        <div className="w-full h-px bg-gray-200 my-2"></div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium leading-tight">เฉลี่ย<br />ที่ทำได้</p>
                            <p className="text-3xl font-bold text-[#344054] mt-1">{getAverageAngle()}°</p>
                        </div>
                    </div>

                    {/* Step Counter & Next Button */}
                    <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg w-[160px] flex items-center justify-between">
                        <div className="pl-3">
                            <span className="text-xs text-gray-500 block">ท่าที่</span>
                            <span className="text-xl font-bold text-[#344054]">{currentStepIndex + 1} <span className="text-gray-400 text-sm">/ {steps.length}</span></span>
                        </div>

                        <button
                            onClick={handleNextStep}
                            disabled={status !== 'TESTING'}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all ${status === 'TESTING'
                                ? "bg-[#40C9D5] hover:bg-[#32a8b3] text-white cursor-pointer hover:scale-110 active:scale-95"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <ChevronRightIcon className="w-7 h-7" />
                        </button>
                    </div>

                </div>

                {/* Center Content */}
                <div className="flex-1 flex items-center justify-center p-6 pointer-events-auto">

                    {/* INSTRUCTION MODAL */}
                    {status === 'INSTRUCTION' && (
                        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl max-w-md w-full text-center animate-[popIn_0.3s_ease-out]">
                            <div className="w-16 h-16 bg-[#FFF4E5] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                ℹ️
                            </div>
                            <h2 className="text-2xl font-bold text-[#344054] mb-2">{currentStep.title}</h2>
                            <p className="text-[#7E8C94] text-base mb-6 text-left bg-gray-50 p-4 rounded-xl">
                                {currentStep.description}
                            </p>
                            <button
                                onClick={startCountdown}
                                className="w-full bg-[#40C9D5] hover:bg-[#32a8b3] text-white text-xl font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-md"
                            >
                                เริ่มทดสอบ
                            </button>
                            {currentStepIndex === 0 && (
                                <p className="text-xs text-gray-400 mt-3">* เมื่อเริ่มแล้ว จะนับถอยหลัง 3 วินาที</p>
                            )}
                        </div>
                    )}

                    {/* COUNTDOWN: 3s Prep */}
                    {status === 'COUNTDOWN' && (
                        <div className="flex flex-col items-center justify-center animate-[popIn_0.3s_ease-out]">
                            <div className="text-[#FF9500] text-[150px] font-black leading-none drop-shadow-2xl animate-[pulse_1s_infinite]">
                                {timer}
                            </div>
                            <p className="text-white text-xl font-bold drop-shadow-md mt-4">เตรียมตัว...</p>
                        </div>
                    )}

                    {/* TESTING: Minimal Visual Cue */}
                    {status === 'TESTING' && (
                        <div className="absolute bottom-10 left-0 right-0 text-center animate-[fadeIn_1s_ease-out]">
                            <p className="text-white/80 text-lg bg-black/40 inline-flex items-center gap-2 px-6 py-2 rounded-full backdrop-blur-md">
                                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                กำลังทดสอบ...
                            </p>
                        </div>
                    )}

                </div>
            </div>

            {/* Global CSS for animations */}
            <style>{`
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}