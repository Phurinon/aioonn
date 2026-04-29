import React, { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function SelectCategory() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  // Mock data for categories
  const categories = ["active", "passive", "preset"];

  // Check for Daily ROM Test requirement (reset at midnight)
  useEffect(() => {
    const lastTestTime = localStorage.getItem(`lastDailyRomTest_${patientId}`);
    if (lastTestTime) {
      const lastDate = new Date(parseInt(lastTestTime)).toLocaleDateString('en-CA');
      const today = new Date().toLocaleDateString('en-CA');

      if (lastDate === today) {
        return; // Already done today
      }
    }
    // Not done today or no record, force test
    navigate(`/daily-rom-test/${patientId}`);
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

        {/* Daily Summary Button */}
        <div className="mt-8 flex justify-center w-full">
          <Link
            to={`/daily-summary/${patientId}`}
            className="w-full bg-gradient-to-r from-[#40C9D5] to-[#2FB5C1] text-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-between group"
          >
            <div className="flex items-center text-left">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform">
                📈
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1 text-white">
                  สรุปผลต่อวัน (Daily Summary)
                </h3>
                <p className="text-white/80 text-sm">
                  ดูเปรียบเทียบองศา Before - After Exercise ของคุณ
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center text-white/50 group-hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
               </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
