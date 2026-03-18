import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, ClockIcon, ChartBarIcon, PencilIcon } from "@heroicons/react/24/outline";

export default function PatientCard({
  id,
  name,
  lastUsed,
  isNew,
  symptoms = [],
  isDeleteMode = false,
  isSelected = false,
  onToggleSelect = () => {},
  onEdit = () => {},
}) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (isDeleteMode) {
      onToggleSelect(id);
    } else {
      navigate(`/select-category/${id}`);
    }
  };

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
      onClick={handleCardClick}
      className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all block border-2 cursor-pointer group relative overflow-hidden ${
        isDeleteMode && isSelected 
          ? "border-red-400 bg-red-50/30 ring-4 ring-red-400/10" 
          : "border-transparent"
      } ${!isDeleteMode ? "hover:border-[#40C9D5] hover:-translate-y-1" : ""}`}
    >
      {/* Delete Selection Overlay & Checkbox */}
      {isDeleteMode && (
        <div className="absolute top-4 right-4 z-20">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? "bg-red-500 border-red-500 scale-110 shadow-lg shadow-red-500/30" 
              : "bg-white border-gray-300"
          }`}>
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-base mt-1 tracking-tight transition-colors truncate whitespace-nowrap ${
            isDeleteMode && isSelected ? "text-red-600" : "text-[#344054]"
          }`} title={name}>
            {name || "default name"}
          </h3>
        </div>
        {!isDeleteMode && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 shrink-0">
            {/* History Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/therapy-history/${id}`);
              }}
              className="w-8 h-8 rounded-full bg-[#F3FBFC] text-[#40C9D5] flex items-center justify-center hover:bg-[#40C9D5] hover:text-white transition shadow-sm z-10"
              title="ดูประวัติการรักษา"
            >
              <ClockIcon className="w-4 h-4" />
            </button>

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

            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
              className="w-8 h-8 rounded-full bg-[#FFF9C4] text-[#FBC02D] flex items-center justify-center hover:bg-[#FBC02D] hover:text-white transition shadow-sm z-10"
              title="แก้ไขข้อมูลคนไข้"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {symptoms.length > 0 ? (
          symptoms.map((item, index) => (
            <div
              key={index}
              className={`rounded-lg p-2.5 text-xs border transition-colors ${
                isDeleteMode && isSelected 
                  ? "bg-red-100/50 border-red-200" 
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-bold ${isDeleteMode && isSelected ? "text-red-700" : "text-[#333E4D]"}`}>
                  {item.symptoms.title}
                </span>
              </div>
              <div className={`${isDeleteMode && isSelected ? "text-red-500" : "text-[#7E8C94]"} font-medium`}>
                ข้าง: {getSideLabel(item.armSide)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[#98A2B3] italic py-2">
            ยังไม่มีข้อมูลอาการ
          </div>
        )}
      </div>

      <div className={`border-t border-dashed my-4 transition-colors ${
        isDeleteMode && isSelected ? "border-red-200" : "border-gray-200"
      }`} />

      {isNew ? (
        <span className={`text-sm font-bold flex items-center gap-1.5 ${
          isDeleteMode && isSelected ? "text-red-500" : "text-[#40C9D5]"
        }`}>
          <span className="bg-current text-white px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">NEW!</span>
          ยังไม่เคยรักษา
        </span>
      ) : (
        <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${
          isDeleteMode && isSelected ? "text-red-400" : "text-[#7E8C94]"
        }`}>
          <ClockIcon className="w-4 h-4" />
          <span>รักษาล่าสุดเมื่อ {lastUsed || "วันนี้"}</span>
        </div>
      )}
    </div>
  );
}
