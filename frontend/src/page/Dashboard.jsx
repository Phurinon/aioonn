import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ClipboardDocumentListIcon, TrashIcon, XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import PatientCard from "../components/PatientCard";
import AddPatientModal from "../components/AddPatientModal";
import EditPatientModal from "../components/EditPatientModal";
import { getPatients, bulkDeletePatients } from "../Functions/patient";
import { verifyPassword } from "../Functions/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for Edit Mode
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  // States for Delete Mode
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchPatients = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const data = await getPatients(user.id);
      setPatients(data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const { searchTerm = "" } = useOutletContext() || {};

  const tabs = [
    { id: "all", label: `ทั้งหมด(${patients.length})` },
    { id: "recent", label: "รักษาล่าสุดวันนี้" },
    { id: "new", label: "ยังไม่เคยรักษา" },
  ];

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const history = patient.therapyHistories || [];
    const isNew = history.length === 0;

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

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleEdit = (id) => {
    const target = patients.find(p => p.id === id);
    if (target) {
      setEditingPatient(target);
      setIsEditModalOpen(true);
    }
  };

  const handleBulkDelete = async () => {
    setIsVerifying(true);
    setErrorMessage("");
    console.log("Starting bulk delete process...");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("Verifying password for user:", user.username);
      
      const verifyRes = await verifyPassword(user.username, password);
      console.log("Verification response:", verifyRes);

      if (verifyRes.valid) {
        console.log("Password verified. Deleting patients:", Array.from(selectedIds));
        const deleteRes = await bulkDeletePatients(Array.from(selectedIds));
        console.log("Delete response:", deleteRes);
        
        await fetchPatients();
        setIsDeleteMode(false);
        setSelectedIds(new Set());
        setIsConfirmModalOpen(false);
        setPassword("");
      } else {
        setErrorMessage("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Bulk delete failed:", error);
      const detail = error.response?.data?.message || error.message;
      setErrorMessage(`เกิดข้อผิดพลาด: ${detail}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-10 py-12 self-start animate-fade-in">
      <div className="flex justify-between items-start mb-10">
        <div className="animate-slide-down">
          <h1 className="text-[36px] font-bold text-[#333E4D] tracking-tight">
            เลือกรายชื่อผู้ป่วย
          </h1>
          <p className="text-[#7E8C94] text-[16px] font-medium mt-2">
            {isDeleteMode 
              ? `เลือกรายชื่อที่ต้องการลบ (${selectedIds.size} รายการ)`
              : "จัดการข้อมูลผู้ป่วยของคุณเพื่อเริ่มกิจกรรมบำบัดได้ที่นี่"}
          </p>
        </div>

        <div className="flex gap-3">
          {isDeleteMode ? (
            <>
              <button
                onClick={() => {
                  setIsDeleteMode(false);
                  setSelectedIds(new Set());
                }}
                className="bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50 px-6 py-3 rounded-full flex items-center gap-2 text-[16px] font-semibold transition-all shadow-sm"
              >
                <XMarkIcon className="w-5 h-5" />
                ยกเลิก
              </button>
              <button
                disabled={selectedIds.size === 0}
                onClick={() => setIsConfirmModalOpen(true)}
                className={`px-8 py-3 rounded-full flex items-center gap-2 text-[16px] font-bold transition-all shadow-lg ${
                  selectedIds.size > 0 
                  ? "bg-red-500 hover:bg-red-600 text-white transform hover:scale-105" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <TrashIcon className="w-5 h-5" />
                ลบที่เลือก ({selectedIds.size})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsDeleteMode(true)}
                className="bg-white border-2 border-red-100 text-red-400 hover:bg-red-50 px-6 py-3 rounded-full flex items-center gap-2 text-[16px] font-semibold transition-all shadow-sm group"
              >
                <TrashIcon className="w-5 h-5 group-hover:shake" />
                ลบรายชื่อ
              </button>
              <button
                onClick={() => navigate("/therapy-history")}
                className="bg-white border-2 border-[#40C9D5] text-[#40C9D5] hover:bg-[#F3FBFC] px-6 py-3 rounded-full flex items-center gap-2 text-[16px] font-semibold shadow-sm transition-all"
              >
                <ClipboardDocumentListIcon className="w-6 h-6" />
                ประวัติการรักษา
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-[#40C9D5] to-[#39B5C0] hover:shadow-xl text-white px-8 py-3 rounded-full flex items-center gap-2 text-[16px] font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                <span className="text-2xl leading-none">+</span>
                เพิ่มผู้ป่วย
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-10 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap
              ${activeTab === tab.id
                  ? "bg-[#40C9D5] text-white shadow-md ring-4 ring-[#40C9D5]/20"
                  : "bg-white border border-gray-100 text-[#7E8C94] hover:bg-gray-50 hover:text-[#40C9D5]"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div key={patient.id} className="relative group">
              <PatientCard
                id={patient.id}
                name={`${patient.firstName} ${patient.lastName}`}
                lastUsed={lastUsed}
                isNew={isNew}
                symptoms={patient.patientSymptoms || []}
                isDeleteMode={isDeleteMode}
                isSelected={selectedIds.has(patient.id)}
                onToggleSelect={() => toggleSelect(patient.id)}
                onEdit={handleEdit}
              />
            </div>
          );
        })}
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isVerifying && setIsConfirmModalOpen(false)}></div>
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative z-10 animate-scale-up">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldCheckIcon className="w-10 h-10 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">ยืนยันการลบข้อมูล</h2>
            <p className="text-gray-500 text-center mb-8">
              คุณแน่ใจหรือไม่ที่จะลบรายชื่อผู้ป่วยจำนวน <span className="font-bold text-red-500">{selectedIds.size} รายการ</span>? กรุณากรอกรหัสผ่านเพื่อยืนยัน
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">รหัสผ่านยืนยัน</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดียวกันกับตอน Login"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none text-center text-lg ${
                    errorMessage ? "border-red-300 bg-red-50 focus:border-red-500" : "border-gray-100 bg-gray-50 focus:border-[#40C9D5] focus:bg-white"
                  }`}
                  autoFocus
                />
                {errorMessage && (
                  <p className="text-red-500 text-sm font-bold mt-2 text-center">{errorMessage}</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  disabled={isVerifying}
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setErrorMessage("");
                    setPassword("");
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={isVerifying || !password}
                  onClick={handleBulkDelete}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all disabled:bg-gray-200 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : "ยืนยันการลบ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        patient={editingPatient}
      />
    </div>
  );
}
