import React, { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function SelectCategory() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  // Mock data for categories
  const categories = ["active", "passive", "preset"];

  // Check for Daily ROM Test requirement
  useEffect(() => {
    const lastTestTime = localStorage.getItem(`lastDailyRomTest_${patientId}`);
    const now = Date.now();
    const tenHours = 10 * 60 * 60 * 1000; // 10 hours for testing

    if (!lastTestTime || (now - parseInt(lastTestTime) > tenHours)) {
      navigate(`/daily-rom-test/${patientId}`);
    }
  }, [patientId, navigate]);

  // Mapping Category ชื่อใหม่
  const categoryMapping = {
    active: "Active",
    passive: "Passive",
    preset: "Preset"
  };

  return (
    <div className="w-full min-h-screen bg-[#F3FBFC]">
      {/* Header Content */}
      <div className="w-full max-w-5xl mx-auto px-6 py-16 text-center">
        {/* Wave Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-[#FFF4E5] rounded-full flex items-center justify-center text-2xl">
            👋
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[40px] font-bold text-[#344054] mb-4">
          ยินดีต้อนรับ
        </h1>
        <p className="text-[#7E8C94] text-[16px] font-medium">
          เลือกหมวดหมู่กิจกรรมบำบัดของคุณเพื่อเริ่มต้นการฟื้นฟูวันนี้
        </p>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {categories.map((category) => (
            <Link
              to={category === "preset"
                ? `/activity/${patientId}/routine/list`
                : `/select-mode/${patientId}/${category}`
              }
              key={category}
              className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 cursor-pointer group hover:-translate-y-1 block"
            >
              {/* Title */}
              <h3 className="font-bold text-[#344054] text-xl mb-3">
                {categoryMapping[category] || category}
              </h3>

              <div className="w-16 h-1 bg-[#40C9D5] rounded-full mx-auto mb-4"></div>

              <p className="text-[#7E8C94] text-sm">
                คลิกเพื่อดูโหมดทั้งหมดในหมวดหมู่นี้
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
