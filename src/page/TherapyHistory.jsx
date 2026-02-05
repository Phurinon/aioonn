import React, { useState, useEffect } from "react";

import { getPatients } from "../Functions/patient";
import { getTherapyHistoryByUserId } from "../Functions/therapy";

export default function TherapyHistory() {
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) return;

      // Fetch patients
      try {
        const patientsData = await getPatients(user.id);
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }

      // Fetch history
      const response = await getTherapyHistoryByUserId(user.id);
      // The API returns { message: "...", data: [...] }
      setHistory(response.data.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory =
    selectedPatientId === "all"
      ? history
      : history.filter(
          (item) => item.patientId === parseInt(selectedPatientId)
        );

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div style={{ fontFamily: "Noto Sans Thai, sans-serif" }}>
          <h1 className="text-[32px] font-bold text-[#344054] tracking-tight">
            ประวัติการรักษา
          </h1>
          <p className="mt-2 text-md text-[#667085]">
            ดูประวัติการรักษาทั้งหมดและกรองรายชื่อผู้ป่วย
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="block w-full appearance-none rounded-xl border border-gray-200 shadow-sm focus:border-[#40C9D5] focus:ring-1 focus:ring-[#40C9D5] sm:text-md py-3 px-4 pr-8 bg-white text-[#344054] outline-none transition-all cursor-pointer hover:border-[#40C9D5]"
          >
            <option value="all">ดูข้อมูลผู้ป่วยทั้งหมด</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg shadow-gray-100 overflow-hidden sm:rounded-2xl border border-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[#40C9D5] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-16 text-center text-gray-400 bg-gray-50/50">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-lg">ไม่พบประวัติการรักษา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    วันที่ / เวลา
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    ผู้ป่วย
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    ประเภทการรักษา
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    ผลการรักษา
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    น้ำหนัก
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    มุมสูงสุด
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F3FBFC] transition-colors duration-150"
                  >
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-[#344054]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#40C9D5] to-[#2BA8B4] flex items-center justify-center text-white text-xs font-medium mr-3">
                          {item.patients
                            ? item.patients.firstName.charAt(0)
                            : "?"}
                        </div>
                        <div className="text-sm font-medium text-[#101828]">
                          {item.patients
                            ? `${item.patients.firstName} ${item.patients.lastName}`
                            : "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {item.therapyTypes ? item.therapyTypes.title : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-[#475467]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {/* <span className="text-xs text-gray-400 uppercase tracking-wide font-medium w-10">
                            เวลา
                          </span> */}
                          <span className="font-medium text-[#344054]">
                            {item.time || 0} วินาที
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* <span className="text-xs text-gray-400 uppercase tracking-wide font-medium w-10">
                            ยกแขนได้
                          </span> */}
                          <span className="font-bold text-[#40C9D5]">
                            {item.score || 0} ครั้ง
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-[#475467]">
                      {item.weight ? (
                        <span className="font-medium text-[#344054]">
                          {item.weight} กิโลกรัม
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-[#475467]">
                      {item.angle ? (
                        <span className="font-medium text-[#344054]">
                          {item.angle}°
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
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
