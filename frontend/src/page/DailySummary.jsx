import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTherapyHistoryByUserId } from "../Functions/therapy";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const activeModes = [
  { slug: 'shoulder-flexion', title: 'ยกแขนด้านหน้า', icon: '🖐️', color: 'from-blue-400 to-blue-600', text: 'text-blue-600', bg: 'bg-blue-50', primary: '#3B82F6', secondary: '#93C5FD' },
  { slug: 'shoulder-abduction', title: 'ยกแขนด้านข้าง', icon: '👐', color: 'from-green-400 to-green-600', text: 'text-green-600', bg: 'bg-green-50', primary: '#10B981', secondary: '#A7F3D0' },
  { slug: 'elbow-rotation', title: 'หมุนศอก', icon: '💪', color: 'from-yellow-400 to-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', primary: '#F59E0B', secondary: '#FDE68A' },
];

function DailySummary() {
  const { patientId } = useParams();
  const [data, setData] = useState({});
  const [overallProgress, setOverallProgress] = useState({ text: "กำลังโหลดข้อมูล...", emoji: "⌛" });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("today"); // 'today' | 'all'
  const chartRefs = React.useRef({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) {
          setLoading(false);
          return;
        }

        const response = await getTherapyHistoryByUserId(user.id);
        const history = response.data?.data || [];

        // Filter by patientId if provided
        let targetHistory = history;
        if (patientId) {
          targetHistory = history.filter(
            (item) => item.patientId === Number(patientId),
          );
        }

        const newModeData = {};
        let totalImprovement = 0;
        let modesWithData = 0;

        activeModes.forEach((mode) => {
          // IDs for each side based on mode
          const sideIds = {
            'shoulder-flexion': { right: 15, left: 16 },
            'shoulder-abduction': { right: 17, left: 18 },
            'elbow-rotation': { right: 19, left: 20 }
          }[mode.slug];

          const modeHistory = targetHistory.filter(item => {
            const tid = item.therapyTypesId;
            const t = item.therapyTypes;
            if (!t) return false;

            // 1. ตรวจสอบตาม ID ที่ระบุเจาะจง
            if (Object.values(sideIds).includes(tid)) return true;

            // 2. ตรวจสอบตาม Slug (รองรับข้อมูลเดิม)
            const slug = (t.slug || "").toLowerCase();
            const modeSlug = mode.slug.toLowerCase();
            if (slug === modeSlug || slug === `${modeSlug}-right` || slug === `${modeSlug}-left`) return true;

            // 3. ตรวจสอบข้อมูล Daily Test เดิมที่อาจไม่มี slug ตรงกันเป๊ะ
            if (t.category?.toLowerCase() === 'daily') {
              const title = (t.title || "").toLowerCase();
              if (modeSlug === 'shoulder-flexion' && (title.includes('flexion') || (title.includes('ยกแขน') && title.includes('หน้า')))) return true;
              if (modeSlug === 'shoulder-abduction' && (title.includes('abduction') || title.includes('กาง'))) return true;
              if (modeSlug === 'elbow-rotation' && (title.includes('rotation') || title.includes('หมุน'))) return true;
            }

            return false;
          });

          const getSideData = (sideHistory, baselineValue) => {
            const activeOnly = sideHistory
              .filter(item => item.therapyTypes?.category?.toLowerCase() !== 'daily')
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
            const last5 = activeOnly.slice(-5);
            if (last5.length === 0) return null;

            const avg = last5.reduce((acc, curr) => acc + (Number(curr.angle) || 0), 0) / last5.length;
            const diff = baselineValue ? avg - baselineValue : 0;
            const percent = baselineValue ? (diff / baselineValue) * 100 : 0;

            return { avg, diff, percent, count: last5.length };
          };

          const rightHistory = modeHistory.filter(item => 
            item.therapyTypesId === sideIds.right || 
            (item.therapyTypes?.slug || "").toLowerCase().includes('right')
          );
          const leftHistory = modeHistory.filter(item => 
            item.therapyTypesId === sideIds.left || 
            (item.therapyTypes?.slug || "").toLowerCase().includes('left')
          );

          const rightBaseline = rightHistory
            .filter(item => item.therapyTypes?.category?.toLowerCase() === 'daily')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.angle || null;
            
          const leftBaseline = leftHistory
            .filter(item => item.therapyTypes?.category?.toLowerCase() === 'daily')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.angle || null;

          const rightSummary = getSideData(rightHistory, rightBaseline);
          const leftSummary = getSideData(leftHistory, leftBaseline);

          let progressText = "";
          let progressEmoji = "💪";

          if (!rightSummary && !leftSummary) {
            progressText = "คอยดูความก้าวหน้าของคุณที่นี่นะ!";
            progressEmoji = "✨";
          } else {
            const summaries = [];
            if (rightSummary) {
              const sign = rightSummary.percent >= 0 ? "+" : "";
              summaries.push(`ขวา: เฉลี่ย ${Math.round(rightSummary.avg)}° (${sign}${Math.round(rightSummary.percent)}%)`);
            }
            if (leftSummary) {
              const sign = leftSummary.percent >= 0 ? "+" : "";
              summaries.push(`ซ้าย: เฉลี่ย ${Math.round(leftSummary.avg)}° (${sign}${Math.round(leftSummary.percent)}%)`);
            }
            progressText = summaries.join(" | ");
            
            // Encouragement logic based on improvement
            const maxPercent = Math.max(rightSummary?.percent || -999, leftSummary?.percent || -999);
            if (maxPercent > 5) progressEmoji = "🚀";
            else if (maxPercent > 0) progressEmoji = "🌟";
            else progressEmoji = "👏";
          }

          // Chart data reconstruction (keep unified view for chart)
          let chartData = [];
          if (viewMode === "today") {
            const today = new Date().toISOString().split('T')[0];
            const todayData = modeHistory.filter(item => item.createdAt.split('T')[0] === today);
            
            // Max test value for today (unified for legend simplicity or keep separate?)
            const dailyMax = Math.max(rightBaseline || 0, leftBaseline || 0);

            chartData = todayData
              .filter(item => item.therapyTypes?.category?.toLowerCase() !== 'daily')
              .map((item, index) => ({
                time: `รอบ ${index + 1}`,
                activeAngle: Number(item.angle) || 0,
                dailyAngle: dailyMax,
                side: item.therapyTypesId === sideIds.right ? 'ขวา' : 'ซ้าย'
              }));
          } else {
            // ... existing grouped logic simplified ...
            const grouped = {};
            modeHistory.forEach(item => {
              const d = item.createdAt.split('T')[0];
              if (!grouped[d]) grouped[d] = { dailyMax: 0, activeMax: 0 };
              const angle = Number(item.angle) || 0;
              if (item.therapyTypes?.category?.toLowerCase() === 'daily') {
                grouped[d].dailyMax = Math.max(grouped[d].dailyMax, angle);
              } else {
                grouped[d].activeMax = Math.max(grouped[d].activeMax, angle);
              }
            });
            chartData = Object.entries(grouped).sort().map(([date, vals]) => ({
              date: new Date(date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
              activeMaxAngle: vals.activeMax,
              dailyMaxAngle: vals.dailyMax
            }));
          }

          newModeData[mode.slug] = {
            progressText,
            progressEmoji,
            chartData,
            rightSummary,
            leftSummary
          };
        });

        setData(newModeData);

        // Overall Motivational Text
        if (modesWithData > 0) {
          const avgImprovement = totalImprovement / modesWithData;
          if (avgImprovement > 5) {
            setOverallProgress({ text: "ยอดเยี่ยมมาก! วันนี้คุณทำสถิติใหม่ได้ทะลุเป้าเลย", emoji: "🏆" });
          } else if (avgImprovement >= 0) {
            setOverallProgress({ text: "เก่งมาก! คุณทำได้ตามเป้าหมายของวันนี้ รักษาระดับไว้นะ", emoji: "⭐" });
          } else {
            setOverallProgress({ text: "ทำได้ดีแล้ว! ค่อยๆ ฝึก ร่างกายจะแข็งแรงขึ้นทุกวันนะ", emoji: "🌱" });
          }
        } else {
          setOverallProgress({ text: "พร้อมจะสร้างสถิติรึยัง? มาเริ่มออกกำลังกายกันเถอะ!", emoji: "🔥" });
        }


      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, viewMode]);

  // เลื่อนไปทางขวาสุดเมื่อข้อมูลโหลดเสร็จหรือเปลี่ยนโหมดการดู
  useEffect(() => {
    if (!loading) {
      // ให้เวลา Recharts เรนเดอร์เล็กน้อย
      setTimeout(() => {
        Object.values(chartRefs.current).forEach(container => {
          if (container) {
            container.scrollLeft = container.scrollWidth;
          }
        });
      }, 300);
    }
  }, [loading, data, viewMode]);

  // Custom Tooltip for BarChart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex flex-col gap-2">
          <p className="font-bold text-gray-700 border-b pb-2 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span>{entry.name}:</span>
              <span className="text-gray-900 font-bold">{Math.round(entry.value)}°</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#F3FBFC] min-h-screen pb-10 font-sans">
      {/* Header Container */}
      <div className="bg-white shadow-sm pt-8 pb-6 px-4 md:px-10 rounded-b-[40px] mb-8 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="self-start md:self-center p-3 rounded-full hover:bg-gray-50 transition-all border border-gray-200 shadow-sm flex items-center justify-center bg-white group hover:-translate-x-1"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 group-hover:text-[#40C9D5]" strokeWidth={2.5} />
          </button>

          <div className="text-center md:text-left flex-1 px-4">
            <h1 className="text-3xl font-extrabold text-[#344054] mb-2">
              สรุปผลการฟื้นฟูประจำวัน
            </h1>
            <p className="text-gray-500 font-medium text-sm md:text-base">
              ติดตามความก้าวหน้า และฉลองให้กับทุกๆ ข้อต่อที่ขยับได้ดีขึ้น
            </p>
          </div>

          {/* Overall Motivation Badge */}
          <div className="bg-gradient-to-r from-[#40C9D5]/10 to-blue-500/10 border border-[#40C9D5]/20 rounded-2xl p-4 flex items-center gap-4 max-w-sm shadow-sm md:self-center w-full md:w-auto mt-4 md:mt-0">
            <div className="text-4xl">{overallProgress.emoji}</div>
            <div>
              <h3 className="font-bold text-[#344054] text-sm">ข้อความจากระบบ</h3>
              <p className="text-[#40C9D5] font-semibold text-sm leading-tight leading-5">{overallProgress.text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-4 md:px-10 flex flex-col gap-8">

        {/* View Mode Toggle - Pills Style */}
        <div className="flex justify-center md:justify-end shrink-0">
          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 inline-flex">
            <button
              onClick={() => setViewMode("today")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "today"
                ? "bg-[#40C9D5] text-white shadow-md transform scale-105"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              ดูของวันนี้
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "all"
                ? "bg-[#40C9D5] text-white shadow-md transform scale-105"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              ดูย้อนหลังทั้งหมด
            </button>
          </div>
        </div>

        {/* Dynamic Cards & Charts */}
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
          {loading ? (
            <div className="lg:col-span-3 text-center py-20 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[#40C9D5] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium animate-pulse">กำลังประมวลผลความสำเร็จของคุณ...</p>
            </div>
          ) : (
            activeModes.map((mode) => {
              const mData = data[mode.slug] || {};
              const chartData = mData.chartData || [];

              return (
                <div key={mode.slug} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-lg transition-shadow duration-300">

                  {/* Card Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${mode.color} text-white shadow-sm transform -rotate-3`}>
                      {mode.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{mode.title}</h2>
                      <p className="text-sm font-medium text-gray-500">{viewMode === 'today' ? 'ประทับใจของวันนี้' : 'สถิติที่ผ่านมา'}</p>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className={`h-[300px] w-full ${mode.bg} rounded-2xl p-4 relative mb-6 border border-white flex flex-col`}>
                    
                    {/* Sticky Legend (คำอธิบายสัญลักษณ์) - อยู่กับที่ ไม่เลื่อนตามกราฟ */}
                    {chartData.length > 0 && (
                      <div className="flex justify-center items-center gap-6 mb-4 mt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mode.primary }}></div>
                          <span className="text-xs font-semibold text-[#4B5563]">
                            {viewMode === "today" ? "ทำได้จริง (ฝึก)" : "ทำได้จริงสูงสุด/วัน"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mode.secondary }}></div>
                          <span className="text-xs font-semibold text-[#4B5563]">
                            {viewMode === "today" ? "เป้าหมาย (ทดสอบ)" : "เป้าหมายสูงสุด/วัน"}
                          </span>
                        </div>
                      </div>
                    )}

                    {chartData.length > 0 ? (
                      <div 
                        ref={el => chartRefs.current[mode.slug] = el}
                        className="w-full flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scroll-smooth"
                      >
                        <div style={{ minWidth: `${Math.max(100, (chartData.length / 20) * 100)}%`, height: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={chartData}
                              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                              barGap={4}
                              barSize={16}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                              <XAxis
                                dataKey={viewMode === "today" ? "time" : "date"}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
                                dy={10}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                              />
                              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)', rx: 8 }} content={<CustomTooltip />} />
                              
                              {viewMode === "today" ? (
                                <>
                                  <Bar dataKey="dailyAngle" name="เป้าหมาย (ทดสอบ)" fill={mode.secondary} radius={[4, 4, 4, 4]} />
                                  <Bar dataKey="activeAngle" name="ทำได้จริง (ฝึก)" fill={mode.primary} radius={[4, 4, 4, 4]} />
                                </>
                              ) : (
                                <>
                                  <Bar dataKey="dailyMaxAngle" name="เป้าหมายสูงสุด/วัน" fill={mode.secondary} radius={[4, 4, 4, 4]} />
                                  <Bar dataKey="activeMaxAngle" name="ทำได้จริงสูงสุด/วัน" fill={mode.primary} radius={[4, 4, 4, 4]} />
                                </>
                              )}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2 opacity-30">😶‍🌫️</span>
                        <p className="text-sm font-semibold">ยังไม่มีข้อมูลในโหมดนี้</p>
                      </div>
                    )}
                  </div>

                  {/* Summary Footer */}
                  <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">ความก้าวหน้า (เฉลี่ย 5 รอบล่าสุด)</p>
                        <p className={`font-extrabold text-base leading-tight ${mode.text}`}>
                          {mData.progressText || "รอการท้าทาย"}
                        </p>
                      </div>
                      <div className="text-3xl ml-2 w-10 flex justify-center drop-shadow-sm">
                        {mData.progressEmoji || "💪"}
                      </div>
                    </div>
                    
                    {/* ข้อมูลแยกข้างแบบละเอียด */}
                    {(mData.rightSummary || mData.leftSummary) && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/50">
                        {['right', 'left'].map(side => {
                          const summary = side === 'right' ? mData.rightSummary : mData.leftSummary;
                          if (!summary) return null;
                          const isUp = summary.percent >= 0;
                          return (
                            <div key={side} className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{side === 'right' ? 'แขนขวา' : 'แขนซ้าย'}</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-gray-700">{Math.round(summary.avg)}°</span>
                                <span className={`text-[11px] font-bold ${isUp ? 'text-green-500' : 'text-orange-500'}`}>
                                  {isUp ? '↑' : '↓'} {Math.abs(Math.round(summary.percent))}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* ข้อความให้กำลังใจ */}
                    <p className="text-[11px] text-gray-400 italic">
                      * เปรียบเทียบกับค่า Baseline จากการทดสอบ ROM รายวันครั้งล่าสุด
                    </p>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default DailySummary;
