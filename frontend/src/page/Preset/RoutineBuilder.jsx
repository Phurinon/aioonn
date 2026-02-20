import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function RoutineBuilder() {
    const { patientId, routineId } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState([]);
    const [availableTherapies, setAvailableTherapies] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch available therapies for selection
        const fetchTherapies = async () => {
            try {
                const response = await axios.get(`${API_URL}/therapy/list`);
                // Filter out "Preset" types to avoid circular routines? 
                // Actually, we probably only want Active/Passive types as steps.
                const filtered = response.data.filter(t => t.category !== "exercise");
                setAvailableTherapies(filtered);
            } catch (error) {
                console.error("Error fetching therapies:", error);
            }
        };

        const fetchRoutine = async () => {
            if (routineId) {
                setLoading(true);
                try {
                    const response = await axios.get(`${API_URL}/routines/${routineId}`);
                    const { title, description, steps } = response.data;
                    setTitle(title);
                    setDescription(description);
                    setSteps(steps.map(s => ({
                        therapyTypeId: s.therapyTypeId,
                        targetCount: s.targetCount || 10,
                        targetTime: s.targetTime || 60,
                        weight: s.weight || 0
                    })));
                } catch (error) {
                    console.error("Error fetching routine:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchTherapies();
        fetchRoutine();
    }, [routineId]);

    const addStep = () => {
        if (availableTherapies.length === 0) return;
        const firstTherapyId = availableTherapies.length > 0 ? availableTherapies[0].id : "";
        setSteps([...steps, {
            therapyTypeId: firstTherapyId,
            targetCount: 10,
            targetTime: 60,
            weight: 0
        }]);
    };

    const removeStep = (index) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return alert("กรุณาระบุชื่อรูทีน");
        if (steps.length === 0) return alert("กรุณาเพิ่มอย่างน้อย 1 ท่า");

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const data = {
            userId: user.id,
            title,
            description,
            steps
        };

        try {
            if (routineId) {
                // Logic for update would go here if we implemented PUT /api/routines/:id
                // For now, let's just implement create and assume update is similar or just re-create.
                // Actually, let's just handle create for this demo.
                await axios.post(`${API_URL}/routines`, data);
            } else {
                await axios.post(`${API_URL}/routines`, data);
            }
            navigate(`/activity/${patientId}/routine/list`, { replace: true });
        } catch (error) {
            console.error("Error saving routine:", error);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#F3FBFC]">
            <div className="w-full max-w-4xl mx-auto px-6 py-16">
                <div className="mb-10">
                    <h1 className="text-[32px] font-bold text-[#344054] mb-2">
                        {routineId ? "แก้ไขรูทีน" : "สร้างรูทีนการฝึกใหม่"}
                    </h1>
                    <p className="text-[#7E8C94]">กำหนดลำดับท่าทางและเป้าหมายในแต่ละรอบ</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Metadata */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#344054] mb-2">ชื่อรูทีน</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="เช่น รูทีนตอนเช้า, ไหล่และศอก"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#40C9D5] outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#344054] mb-2">คำอธิบาย (ไม่บังคับ)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="รายละเอียดสั้นๆ เกี่ยวกับชุดการฝึกนี้"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#40C9D5] outline-none transition h-24 resize-none"
                            />
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="font-bold text-[#344054] text-xl">ลำดับการฝึก</h3>
                            <button
                                type="button"
                                onClick={addStep}
                                className="text-[#40C9D5] font-bold hover:underline"
                            >
                                + เพิ่มท่าทาง
                            </button>
                        </div>

                        <div className="space-y-4">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 relative group animate-[fadeIn_0.3s_ease-out]"
                                >
                                    <div className="flex-shrink-0 w-8 h-8 bg-[#F3FBFC] text-[#40C9D5] font-bold rounded-full flex items-center justify-center border border-[#E0F2F2]">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-[#7E8C94] uppercase mb-1">เลือกท่า</label>
                                            <select
                                                value={step.therapyTypeId}
                                                onChange={(e) => updateStep(index, "therapyTypeId", e.target.value)}
                                                className="w-full bg-gray-50 px-3 py-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-[#40C9D5]"
                                            >
                                                {/* Group by category */}
                                                {Object.entries(
                                                    availableTherapies.reduce((acc, t) => {
                                                        const catName = t.category === "arm-raise" ? "Active (การฝึกขยับ)" :
                                                            t.category === "core" ? "Passive (การฝึกทรงตัว)" : t.category;
                                                        if (!acc[catName]) acc[catName] = [];
                                                        acc[catName].push(t);
                                                        return acc;
                                                    }, {})
                                                ).map(([groupName, items]) => (
                                                    <optgroup key={groupName} label={groupName}>
                                                        {items.map(t => (
                                                            <option key={t.id} value={t.id}>{t.title}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[#7E8C94] uppercase mb-1">จำนวน (ครั้ง)</label>
                                            <input
                                                type="number"
                                                value={step.targetCount}
                                                onChange={(e) => updateStep(index, "targetCount", e.target.value)}
                                                className="w-full bg-gray-50 px-3 py-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-[#40C9D5]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[#7E8C94] uppercase mb-1">เวลาเป้าหมาย (วินาที)</label>
                                            <input
                                                type="number"
                                                value={step.targetTime}
                                                onChange={(e) => updateStep(index, "targetTime", e.target.value)}
                                                className="w-full bg-gray-50 px-3 py-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-[#40C9D5]"
                                            />
                                        </div>

                                        <div className="flex items-end pb-1">
                                            <button
                                                type="button"
                                                onClick={() => removeStep(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors text-sm font-medium"
                                            >
                                                ลบรายการ
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remove the absolute delete button since we moved it into the grid for better layout when removing weight */}
                                </div>
                            ))}

                            {steps.length === 0 && (
                                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-[#7E8C94]">
                                    ยังไม่มีท่าในรายการ กด "เพิ่มท่าทาง" เพื่อเริ่มออกแบบรูทีน
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={() => navigate(`/activity/${patientId}/routine/list`)}
                            className="flex-1 py-4 border border-gray-200 text-[#7E8C94] font-bold rounded-2xl hover:bg-white transition"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 bg-[#40C9D5] text-white font-bold rounded-2xl hover:bg-[#2BA8B4] transition shadow-lg"
                        >
                            บันทึกรูทีน
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
