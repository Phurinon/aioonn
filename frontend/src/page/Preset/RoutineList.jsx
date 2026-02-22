import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { deleteRoutine, getRoutineByUserId } from "../../Functions/routine";


export default function RoutineList() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoutines = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                if (!user.id) return;

                const response = await getRoutineByUserId(user.id)
                setRoutines(response);
            } catch (error) {
                console.error("Error fetching routines:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoutines();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("คุณต้องการลบรูทีนนี้ใช่หรือไม่?")) return;

        try {
            await deleteRoutine(id);
            setRoutines(routines.filter(r => r.id !== id));
        } catch (error) {
            console.error("Error deleting routine:", error);
            alert("เกิดข้อผิดพลาดในการลบ");
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#F3FBFC]">
            <div className="w-full max-w-5xl mx-auto px-6 py-16">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-[36px] font-bold text-[#344054] mb-2">
                            ชุดการฝึก <span className="text-[#40C9D5]">(Routines)</span>
                        </h1>
                        <p className="text-[#7E8C94] text-[16px] font-medium">
                            จัดการคอร์สการฝึกแบบต่อเนื่องของคุณ
                        </p>
                    </div>
                    <Link
                        to={`/activity/${patientId}/routine/create`}
                        className="bg-[#40C9D5] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2BA8B4] transition shadow-md flex items-center gap-2"
                    >
                        <span>+</span> สร้างรูทีนใหม่
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-[#7E8C94]">กำลังโหลด...</div>
                ) : routines.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                        <div className="text-6xl mb-6">📅</div>
                        <h3 className="text-xl font-bold text-[#344054] mb-2">ยังไม่มีรูทีนที่สร้างไว้</h3>
                        <p className="text-[#7E8C94] mb-8">สร้างรูทีนแรกของคุณ เพื่อรวมท่าการฝึกต่างๆ ไว้ในที่เดียว</p>
                        <Link
                            to={`/activity/${patientId}/routine/create`}
                            className="inline-block bg-[#40C9D5] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#2BA8B4] transition"
                        >
                            เริ่มสร้างรูทีน
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {routines.map((routine) => (
                            <div
                                key={routine.id}
                                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#344054] mb-1">{routine.title}</h3>
                                        <p className="text-[#7E8C94] text-sm line-clamp-2">{routine.description || "ไม่มีคำอธิบาย"}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDelete(routine.id)}
                                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"
                                            title="ลบ"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 mb-6">
                                    <div className="text-sm font-semibold text-[#344054] mb-2">รายการท่า ({routine.steps?.length || 0}):</div>
                                    <div className="flex flex-wrap gap-2">
                                        {routine.steps?.map((step, idx) => (
                                            <span key={step.id} className="inline-flex items-center bg-gray-50 text-xs font-medium px-2.5 py-0.5 rounded-full text-gray-600 border border-gray-100">
                                                {idx + 1}. {step.therapyType?.title || "ไม่ทราบชื่อท่า"}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <Link
                                        to={`/activity/${patientId}/routine/edit/${routine.id}`}
                                        className="flex-1 py-3 border border-gray-200 text-[#7E8C94] text-center font-bold rounded-xl hover:bg-gray-50 transition"
                                    >
                                        แก้ไข
                                    </Link>
                                    <Link
                                        to={`/activity/${patientId}/routine/run/${routine.id}`}
                                        className="flex-1 py-3 bg-[#40C9D5] text-white text-center font-bold rounded-xl hover:bg-[#2BA8B4] transition shadow-sm"
                                    >
                                        เริ่มการฝึก
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
