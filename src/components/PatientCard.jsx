import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, ClockIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export default function PatientCard({
  id,
  name,
  lastUsed,
  isNew,
  symptoms = [],
}) {
  const navigate = useNavigate();

  const getSideLabel = (side) => {
    switch (side) {
      case "Left":
        return "ซ้าย";
      case "Right":
        return "ขวา";
      case "Both":
        return "ทั้งสองข้าง";
      default:
        return side;
    }
  };

  return (
    <div
      onClick={() => navigate(`/select-category/${id}`)}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition block border border-gray-100 cursor-pointer group"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-[#344054] text-base mt-1">
          {name || "default name"}
        </h3>
        <div className="flex items-center gap-2">
          {/* Summary Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/summary/${id}`);
            }}
            className="w-8 h-8 rounded-full bg-[#E0F2F1] text-[#009688] flex items-center justify-center hover:bg-[#B2DFDB] transition shadow-sm z-10"
            title="ดูสรุปผล"
          >
            <ChartBarIcon className="w-4 h-4" />
          </button>

          {/* Navigate Arrow */}
          <div className="w-8 h-8 rounded-full bg-[#F0F0F0] flex items-center justify-center group-hover:bg-[#40C9D5] group-hover:text-white transition">
            <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {symptoms.length > 0 ? (
          symptoms.map((item, index) => (
            <div
              key={index}
              className="bg-[#F8F9FA] rounded-lg p-2 text-xs border border-gray-100"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-[#333E4D]">
                  {item.symptoms.title}
                </span>
                <span className="text-[#40C9D5] font-medium bg-[#E0F7FA] px-1.5 py-0.5 rounded">
                  Lv.{item.level}
                </span>
              </div>
              <div className="text-[#7E8C94]">
                ข้าง: {getSideLabel(item.armSide)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[#98A2B3] italic">
            ยังไม่มีข้อมูลอาการ
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-gray-200 my-4" />

      {isNew ? (
        <span className="text-[#40C9D5] text-sm font-medium">
          <span className="text-[#40C9D5] font-bold">NEW!</span> ยังไม่เคยรักษา
        </span>
      ) : (
        <div className="flex items-center gap-2 text-[#7E8C94] text-sm">
          <ClockIcon className="w-4 h-4" />
          <span>รักษาล่าสุดเมื่อ {lastUsed || "วันนี้"}</span>
        </div>
      )}
    </div>
  );
}
