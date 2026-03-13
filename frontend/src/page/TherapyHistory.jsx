import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { 
  ArrowLeftIcon, 
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  UserIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

import { getPatients } from "../Functions/patient";
import { getTherapyHistoryByUserId } from "../Functions/therapy";

export default function TherapyHistory() {
  const { historyPatientId } = useParams();
  const navigate = useNavigate();
  const { searchTerm = "" } = useOutletContext() || {}; 
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) return;

      const [patientsData, historyResponse] = await Promise.all([
        getPatients(user.id),
        getTherapyHistoryByUserId(user.id)
      ]);

      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setHistory(historyResponse.data.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const patientsWithHistory = useMemo(() => {
    const patientHistoryMap = history.reduce((acc, item) => {
      if (!acc[item.patientId]) {
        acc[item.patientId] = {
          patient: item.patients || patients.find(p => p.id === item.patientId),
          count: 0,
          lastActivity: item.createdAt
        };
      }
      acc[item.patientId].count += 1;
      if (new Date(item.createdAt) > new Date(acc[item.patientId].lastActivity)) {
        acc[item.patientId].lastActivity = item.createdAt;
      }
      return acc;
    }, {});

    return Object.values(patientHistoryMap).filter(({ patient }) => {
      if (!patient) return false;
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }, [history, patients, searchTerm]);

  const selectedPatientHistory = useMemo(() => {
    if (!historyPatientId) return [];
    return history.filter(item => item.patientId === parseInt(historyPatientId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [history, historyPatientId]);

  const selectedPatient = useMemo(() => {
    if (!historyPatientId) return null;
    return patients.find(p => p.id === parseInt(historyPatientId)) || 
           (selectedPatientHistory.length > 0 ? selectedPatientHistory[0].patients : null);
  }, [patients, historyPatientId, selectedPatientHistory]);

  const formatDate = (dateString, showTime = true) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(showTime && { hour: "2-digit", minute: "2-digit" })
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#40C9D5] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium tracking-wide">กำลังดึงข้อมูลประวัติการรักษา...</p>
      </div>
    );
  }

  if (historyPatientId) {
    return (
      <div className="w-full max-w-7xl mx-auto px-10 py-12 animate-in fade-in duration-500">
        <button
          onClick={() => navigate("/therapy-history")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#40C9D5] font-semibold mb-8 transition-all group"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          กลับไปยังรายชื่อผู้ป่วย
        </button>

        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between mb-10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#40C9D5]/5 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-[#40C9D5] bg-[#F3FBFC] px-3 py-1 rounded-lg border border-[#40C9D5]/20 uppercase tracking-widest">
                  Personal Record
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  REF-{historyPatientId.toString().padStart(4, '0')}
                </span>
              </div>
              <h1 className="text-[36px] font-semibold text-[#333E4D] mt-2">
                {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "ข้อมูลผู้ป่วย"}
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate(`/select-category/${historyPatientId}`)}
            className="bg-[#40C9D5] hover:bg-[#39B5C0] text-white px-10 py-3.5 rounded-2xl font-semibold shadow-lg shadow-[#40C9D5]/20 transition-all hover:scale-[1.02] active:scale-[0.98] relative z-10"
          >
            เริ่มกิจกรรมใหม่
          </button>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          {selectedPatientHistory.length === 0 ? (
            <div className="p-24 text-center">
              <p className="text-xl font-bold text-[#344054]">ยังไม่มีประวัติการรักษา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8F9FA] border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-[#333E4D]">เวลาที่บันทึก</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-[#333E4D]">โหมดการรักษา</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-[#333E4D]">จำนวนครั้ง</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-[#333E4D]">น้ำหนัก (kg)</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-[#333E4D]">องศา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedPatientHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F3FBFC]/40 transition-colors group">
                      <td className="px-8 py-6 text-[15px] font-medium text-[#475467]">
                        <div className="flex items-center gap-3">
                           <ClockIcon className="w-4 h-4 text-[#AAB4B9]" />
                           {formatDate(item.createdAt)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-[#F3FBFC] text-[#40C9D5] px-4 py-1.5 rounded-full text-xs font-semibold border border-[#40C9D5]/10 group-hover:bg-[#40C9D5] group-hover:text-white transition-all">
                          {item.therapyTypes ? item.therapyTypes.title : "-"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#333E4D]">{item.score || 0} ครั้ง</span>
                          <span className="text-xs text-[#7E8C94]">{item.time || 0} วินาที</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-[#475467] font-medium">{item.weight || 0}</td>
                      <td className="px-8 py-6 font-bold text-[#333E4D]">{item.angle ? `${item.angle}°` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-10 py-12 animate-in fade-in duration-700">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-400 hover:text-[#40C9D5] font-semibold mb-8 transition-all group"
      >
        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        กลับไปยังหน้าจัดการผู้ป่วย
      </button>

      <div className="mb-10" style={{ fontFamily: "Noto Sans Thai, sans-serif" }}>
        <h1 className="text-[36px] font-semibold text-[#333E4D]">
          ประวัติการรักษา
        </h1>
        <p className="text-[#7E8C94] text-[16px] font-medium mt-2">
          ประวัติกิจกรรมการรักษาของผู้ป่วยทั้งหมด
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {patientsWithHistory.map(({ patient, count, lastActivity }) => (
          <div
            key={patient.id}
            onClick={() => navigate(`/therapy-history/${patient.id}`)}
            className="group bg-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-gray-100 hover:border-[#40C9D5]/40 hover:shadow-xl hover:shadow-[#40C9D5]/5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-8 w-full md:w-auto">
              <div>
                <h3 className="text-[28px] font-semibold text-[#333E4D] group-hover:text-[#40C9D5] transition-colors leading-tight">
                  {patient.firstName} {patient.lastName}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold text-[#AAB4B9] uppercase tracking-wider">
                    Patient Entry
                  </span>
                  <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                  <span className="text-[10px] font-bold text-[#40C9D5]">
                    #{patient.id.toString().padStart(3, '0')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto md:gap-16">
              <div className="text-left md:text-right">
                <p className="text-[12px] text-[#AAB4B9] font-medium uppercase tracking-wider mb-1">ทำกิจกรรมล่าสุดเมื่อ</p>
                <p className="text-[18px] font-semibold text-[#475467]">{formatDate(lastActivity, false)}</p>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center justify-center bg-[#F3FBFC] w-14 h-14 rounded-xl border border-[#40C9D5]/10 group-hover:bg-[#40C9D5] group-hover:text-white transition-all">
                  <span className="text-[20px] font-bold leading-none">{count}</span>
                  <span className="text-[10px] font-semibold uppercase">ครั้ง</span>
                </div>
                <ChevronRightIcon className="w-6 h-6 text-gray-300 group-hover:text-[#40C9D5] transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
