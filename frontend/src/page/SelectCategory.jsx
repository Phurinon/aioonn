import React from "react";
import { Link, useParams } from "react-router-dom";

// ข้อมูลหมวดหมู่กิจกรรม
const categories = [
  {
    id: "arm-raise",
    title: "การยกแขน",
    description: "ฝึกการยกแขนพัฒนาการหมุนของหัวไหล่",
    icon: "🙋",
    color: "bg-[#E8F8FA]",
    iconColor: "text-[#40C9D5]",
  },
  {
    id: "core",
    title: "แกนกลางลำตัว",
    description: "ดูความบาลานซ์ของร่างกาย\nปรับท่ายืน",
    icon: "🧍",
    color: "bg-[#E8F8FA]",
    iconColor: "text-[#40C9D5]",
  },
  {
    id: "exercise",
    title: "การออกกำลังกาย",
    description: "บริหารและพัฒนากล้ามเนื้อ",
    icon: "🏋️",
    color: "bg-[#FFF4E5]",
    iconColor: "text-[#F5A623]",
  },
];

export default function SelectCategory() {
  const { patientId } = useParams();

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
              to={`/select-mode/${patientId}/${category.id}`}
              key={category.id}
              className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100 cursor-pointer group hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`w-20 h-20 ${category.color} rounded-full flex items-center justify-center mx-auto mb-6 text-4xl group-hover:scale-110 transition-transform`}
              >
                {category.icon}
              </div>

              {/* Title */}
              <h3 className="font-bold text-[#344054] text-xl mb-3">
                {category.title}
              </h3>

              {/* Description */}
              <p className="text-[#7E8C94] text-sm whitespace-pre-line">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
