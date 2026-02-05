import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import PatientCard from "../components/PatientCard";
import AddPatientModal from "../components/AddPatientModal";
import { getPatients } from "../Functions/patient";

export default function Dashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        // If user.id exists, fetch only their patients. Otherwise fetch all (or handle as error if preferred).
        const data = await getPatients(user.id);
        setPatients(data);
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      }
    };
    fetchPatients();
  }, []);

  // Retrieve searchTerm passed from Layout via Outlet context
  const { searchTerm = "" } = useOutletContext() || {};

  // Filter tabs data
  const tabs = [
    { id: "all", label: `ทั้งหมด(${patients.length})` },
    { id: "recent", label: "รักษาล่าสุดวันนี้" },
    { id: "new", label: "ยังไม่เคยรักษา" },
  ];

  // กรองผู้ป่วยตาม tab และ searchTerm
  const filteredPatients = patients.filter((patient) => {
    // 1. Filter by Search Term
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Filter by Tab Logic
    const history = patient.therapyHistories || [];
    const isNew = history.length === 0;

    // Check if last therapy was today
    let isRecent = false;
    if (history.length > 0) {
      const lastDate = new Date(history[0].createdAt);
      const today = new Date();
      isRecent =
        lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear();
    }

    if (activeTab === "all") return true;
    if (activeTab === "recent") return isRecent;
    if (activeTab === "new") return isNew;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-10 py-12 self-start">
      {/* Header Section: ชื่อหัวข้อ และ ปุ่มเพิ่มผู้ป่วย */}
      <div className="flex justify-between items-start mb-8">
        <div style={{ fontFamily: "Noto Sans Thai, sans-serif" }}>
          <h1 className="text-[36px] font-semibold text-[#333E4D]">
            เลือกรายชื่อผู้ป่วย
          </h1>
          <p className="text-[#7E8C94] text-[16px] font-medium mt-2">
            เลือกผู้ป่วยเพื่อเริ่มกิจกรรมบำบัด
            หรือจัดการข้อมูลผู้ป่วยของคุณได้ที่นี่
          </p>
        </div>

        {/* ปุ่มสีฟ้าทางด้านขวา */}
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/therapy-history")}
            className="bg-white border-2 border-[#40C9D5] text-[#40C9D5] hover:bg-[#F0FDFA] px-6 py-3 rounded-full flex items-center gap-2 text-[16px] font-semibold shadow-sm transition-all"
          >
            <ClipboardDocumentListIcon className="w-6 h-6" />
            ประวัติการรักษา
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#40C9D5] hover:bg-[#39B5C0] text-white px-6 py-3 rounded-full flex items-center gap-2 text-[16px] font-semibold shadow-sm transition-all"
          >
            <span className="text-xl leading-none">+</span>
            เพิ่มผู้ป่วย
          </button>
        </div>
      </div>

      {/* Tabs Section: ทั้งหมด, ใช้งานล่าสุด, ยังไม่เคยใช้งาน */}
      <div className="flex gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all
              ${
                activeTab === tab.id
                  ? "bg-[#40C9D5] text-white"
                  : "bg-white border border-gray-200 text-[#7E8C94] hover:border-[#40C9D5] hover:text-[#40C9D5]"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredPatients.map((patient) => {
          const history = patient.therapyHistories || [];
          const isNew = history.length === 0;
          let lastUsed = "ยังไม่เคยรักษา";

          if (!isNew) {
            const date = new Date(history[0].createdAt);
            const today = new Date();
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();

            lastUsed = isToday
              ? "วันนี้"
              : date.toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                });
          }

          return (
            <PatientCard
              key={patient.id}
              id={patient.id}
              name={`${patient.firstName} ${patient.lastName}`}
              lastUsed={lastUsed}
              isNew={isNew}
              symptoms={patient.patientSymptoms || []}
            />
          );
        })}
      </div>

      {/* Modal เพิ่มผู้ป่วย */}
      <AddPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
