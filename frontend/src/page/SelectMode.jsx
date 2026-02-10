import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getTherapyType } from "../Functions/therapy";

export default function SelectMode() {
  const { patientId, categoryId } = useParams();
  const [modes, setModes] = useState([]);

  useEffect(() => {
    getTherapyType()
      .then((res) => {
        const data = res.data;
        if (data && Array.isArray(data)) {
          // Filter modes by category
          const filteredModes = data.filter(
            (item) => item.category === categoryId
          );
          setModes(filteredModes);
        }
      })
      .catch((err) => {
        console.error("Error fetching modes:", err);
      });
  }, [categoryId]);

  return (
    <div className="w-full min-h-screen bg-[#F3FBFC]">
      <div className="w-full max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-[36px] font-bold text-[#344054] mb-4 text-center">
          โหมด: <span className="text-[#40C9D5]">{categoryId}</span>
        </h1>
        <p className="text-[#7E8C94] text-[16px] font-medium text-center mb-12">
          เลือกโหมดการฝึกที่คุณต้องการ
        </p>

        {modes.length === 0 ? (
          <div className="text-center text-[#7E8C94] mt-10">
            ไม่พบข้อมูลโหมดในหมวดหมู่นี้
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {modes.map((mode) => (
              <Link
                to={`/activity/${patientId}/${mode.category}/${mode.slug}`}
                key={mode.id}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 cursor-pointer group hover:-translate-y-1 block h-full"
              >
                <h3 className="font-bold text-[#344054] text-lg mb-2">
                  {mode.title}
                </h3>

                <p className="text-[#7E8C94] text-sm whitespace-pre-line leading-relaxed">
                  {mode.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
