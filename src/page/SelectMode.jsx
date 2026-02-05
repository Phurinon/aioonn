import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getTherapyType } from "../Functions/therapy";

// ข้อมูลหมวดหมู่
const categoryInfo = {
  "arm-raise": {
    title: "การยกแขน",
    icon: "🙋",
    color: "text-[#40C9D5]",
  },
  core: {
    title: "แกนกลางลำตัว",
    icon: "🧍",
    color: "text-[#40C9D5]",
  },
  exercise: {
    title: "การออกกำลังกาย",
    icon: "🏋️",
    color: "text-[#F5A623]",
  },
};

// ข้อมูลโหมดสำหรับแต่ละหมวด
const modesData = {
  "arm-raise": [
    {
      id: "assisted",
      title: "มีผู้ช่วยยกแขน",
      description: "มีผู้ช่วยประคองแขนหรือ\nใช้สองมือประคอง",
      icon: "👥",
      color: "bg-[#E8F8FA]",
    },
    {
      id: "self",
      title: "ยกแขนด้วยตัวเอง",
      description: "ผู้ป่วยออกแรงยกแขนเอง",
      icon: "🧍",
      color: "bg-[#E8F8FA]",
    },
    {
      id: "count",
      title: "นับจำนวน",
      description: "นับจำนวนครั้งที่ยกได้",
      icon: "📋",
      color: "bg-[#FFF0F5]",
    },
    {
      id: "timer",
      title: "จับเวลา",
      description: "จับเวลานับถอยหลังและ\nนับจำนวนการยกแขนในเวลาที่ตั้ง",
      icon: "⏱️",
      color: "bg-[#F0E8FF]",
    },
  ],
  core: [
    {
      id: "balance",
      title: "ทดสอบการทรงตัว",
      description: "ทดสอบความสามารถในการทรงตัว",
      icon: "⚖️",
      color: "bg-[#E8F8FA]",
    },
    {
      id: "posture",
      title: "ปรับท่ายืน",
      description: "ปรับปรุงท่าทางการยืน",
      icon: "🧍",
      color: "bg-[#E8F8FA]",
    },
  ],
  exercise: [
    {
      id: "strength",
      title: "เสริมสร้างกล้ามเนื้อ",
      description: "ออกกำลังกายเสริมความแข็งแรง",
      icon: "💪",
      color: "bg-[#FFF4E5]",
    },
    {
      id: "stretch",
      title: "ยืดเหยียด",
      description: "ยืดเหยียดกล้ามเนื้อ",
      icon: "🤸",
      color: "bg-[#E8F8FA]",
    },
  ],
};

export default function SelectMode() {
  const { patientId, categoryId } = useParams();
  const category = categoryInfo[categoryId] || categoryInfo["arm-raise"];
  const modes = modesData[categoryId] || modesData["arm-raise"];
  // const [modes, setModes] = useState([]);

  // useEffect(() => {
  //   getTherapyType()
  //     .then((res) => {
  //       const data = res.data;
  //       if (data && Array.isArray(data)) {
  //         // API returns an array of modes.
  //         // Since the API response doesn't have a 'category' field (based on logs),
  //         // we use the data directly or we might need to rely on the backend to filter.
  //         // For now, we'll map the API data to include UI properties like icon and color if missing.
  //         const mappedModes = data.map((item, index) => ({
  //           ...item,
  //           // Fallback UI properties if not present in API
  //           // icon: item.icon || "📋",
  //           color:
  //             item.color || (index % 2 === 0 ? "bg-[#E8F8FA]" : "bg-[#FFF0F5]"),
  //         }));
  //         setModes(mappedModes);
  //       } else if (data && typeof data === "object") {
  //         setModes(data[categoryId] || []);
  //       }
  //       console.log("Fetched modes:", data);
  //     })
  //     .catch((err) => {
  //       console.error("Error fetching modes:", err);
  //     });
  // }, [categoryId]);

  return (
    <div className="w-full min-h-screen bg-[#F3FBFC]">
      {/* Header Content */}
      <div className="w-full max-w-5xl mx-auto px-6 py-16 text-center">
        {/* Category Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-[#E8F8FA] rounded-full flex items-center justify-center text-2xl">
            {category.icon}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[36px] font-bold text-[#344054] mb-2">
          หมวดหมู่ <span className={category.color}>{category.title}</span>
        </h1>
        <p className="text-[#7E8C94] text-[16px] font-medium">
          เลือกรูปแบบกิจกรรมที่ใช้ในการฟื้นฟู
        </p>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {modes.map((mode) => (
            <Link
              to={`/activity/${patientId}/${categoryId}/${mode.id}`}
              key={mode.id}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 cursor-pointer group hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`w-16 h-16 ${mode.color} rounded-full flex items-center justify-center mx-auto mb-5 text-3xl group-hover:scale-110 transition-transform`}
              >
                {mode.icon}
              </div>

              {/* Title */}
              <h3 className="font-bold text-[#40C9D5] text-lg mb-2">
                {mode.title}
              </h3>

              {/* Description */}
              <p className="text-[#7E8C94] text-sm whitespace-pre-line leading-relaxed">
                {mode.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
