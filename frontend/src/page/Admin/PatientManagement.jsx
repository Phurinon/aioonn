import React, { useState, useEffect } from "react";
import { getPatients, deletePatient } from "../../Functions/patient";
import Swal from "sweetalert2";
import { UsersIcon, CheckCircleIcon, QueueListIcon, TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import EditPatientModal from "../../components/EditPatientModal";

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = async () => {
    try {
      // Get all patients without userId filter (assumes getPatients supports this)
      const response = await getPatients();
      setPatients(response);
    } catch (error) {
      console.error("Error fetching patients:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลผู้ป่วยได้",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ",
      text: `คุณต้องการลบข้อมูลผู้ป่วย "${name}" ใช่หรือไม่?`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#40C9D5",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await deletePatient(id);
        setPatients(patients.filter((p) => p.id !== id));
        Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "ลบข้อมูลผู้ป่วยสำเร็จ",
          confirmButtonColor: "#40C9D5",
        });
      } catch (error) {
        console.error("Error deleting patient:", error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถลบข้อมูลผู้ป่วยได้",
          confirmButtonColor: "#40C9D5",
        });
      }
    }
  };

  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">กำลังโหลด...</div>;
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">จัดการข้อมูลผู้ป่วย</h2>
          <p className="text-sm text-gray-500 mt-1">
            รายการผู้ป่วยทั้งหมดในระบบ (อ่านเท่านั้น)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="py-4 px-6 font-semibold">ID</th>
              <th className="py-4 px-6 font-semibold">ชื่อผู้ป่วย</th>
              <th className="py-4 px-6 font-semibold">ผู้ดูแล (Hospital ID)</th>
              <th className="py-4 px-6 font-semibold">วันที่บันทึก (ล่าสุด)</th>
              <th className="py-4 px-6 font-semibold text-center">อาการ/ประวัติ</th>
              <th className="py-4 px-6 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.length > 0 ? (
              patients.map((patient) => {
                const latestHistory = patient.therapyHistories?.[0];
                const symptomCount = patient.patientSymptoms?.length || 0;

                return (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-800">{patient.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
                          <UsersIcon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-800">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{patient.userId}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {latestHistory
                        ? new Date(latestHistory.createdAt).toLocaleDateString("th-TH")
                        : "-"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-3">
                        <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold" title="จำนวนอาการตั้งต้น">
                          <QueueListIcon className="w-4 h-4"/>
                          {symptomCount}
                        </div>
                        <div className="flex items-center gap-1 bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-semibold" title="จำนวนประวัติการรักษาทั้งหมด">
                          <CheckCircleIcon className="w-4 h-4"/>
                          {patient.therapyHistories?.length || 0}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(patient)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id, `${patient.firstName} ${patient.lastName}`)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  ไม่พบข้อมูลผู้ป่วย
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPatient(null);
        }}
        patientData={selectedPatient}
      />
    </div>
  );
}
