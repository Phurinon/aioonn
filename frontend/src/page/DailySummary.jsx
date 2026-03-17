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
        setData({}); // ล้างข้อมูลเก่าออกก่อนโหลดใหม่ เพื่อป้องกันข้อมูลคนเก่าค้าง
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) {
          setLoading(false);
          return;
        }

        const response = await getTherapyHistoryByUserId(user.id);
        const history = response.data?.data || [];

        // Fetch all therapy types to map IDs dynamically
        const typesResponse = await fetch("http://localhost:3000/api/therapy/list").then(r => r.json());
        const therapyTypes = Array.isArray(typesResponse) ? typesResponse : (typesResponse.data || []);

        // Filter by patientId if provided
        let targetHistory = history;
        if (patientId) {
          targetHistory = history.filter(
            (item) => item.patientId == patientId,
          );
        }

        const newModeData = {};
        let totalImprovement = 0;
        let modesWithData = 0;

        const getSideData = (sideHistory, baselineValue) => {
          const activeOnly = sideHistory
            .filter(item => {
              const category = (item.therapyTypes?.category || "").toLowerCase();
              const title = (item.therapyTypes?.title || "").toLowerCase();
              const score = Number(item.score) || 0;

              // รอบการฝึกจริงต้องมีคะแนน (score > 0) หรือไม่ได้อยู่ในหมวดทดสอบ
              return score > 0 || !(category === 'daily' || category === 'baseline' || title.includes('ทดสอบ'));
            })
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // เรียงเก่าไปใหม่

          const last5 = activeOnly.slice(-5);
          if (last5.length === 0) return null;

          const avg = last5.reduce((acc, curr) => acc + (Number(curr.angle) || 0), 0) / last5.length;
          const diff = baselineValue ? avg - baselineValue : 0;
          const percent = baselineValue ? (diff / baselineValue) * 100 : 0;

          return { avg, diff, percent, count: last5.length };
        };

        // รหัส ID ของท่าทางทดสอบ (Daily ROM) ที่เราทราบค่าที่แน่นอน
        const dailyRomIds = {
          'shoulder-flexion': [15, 16],
          'shoulder-abduction': [17, 18],
          'elbow-rotation': [19, 20]
        };

        activeModes.forEach((mode) => {
          const modeSlug = mode.slug.toLowerCase();
          const modeTitle = mode.title.toLowerCase();

          // 1. ค้นหาประเภทท่าทางทั้งหมดที่เกี่ยวข้องกับ Mode นี้
          const modeTypes = therapyTypes.filter(t => {
            const slug = (t.slug || "").toLowerCase();
            const title = (t.title || "").toLowerCase();
            const category = (t.category || "").toLowerCase();

            if (slug && (slug === modeSlug || slug.includes(modeSlug))) return true;
            if (title && (title.includes(modeSlug) || title.includes(modeTitle))) return true;

            return false;
          });

          const modeTypeIds = modeTypes.map(t => t.id);

          // 2. กรองประวัติที่เกี่ยวข้องกับ Mode นี้
          const modeHistory = targetHistory
            .filter(item => {
              if (modeTypeIds.includes(item.therapyTypesId)) return true;
              const t = item.therapyTypes || {};
              const slug = (t.slug || "").toLowerCase();
              const title = (t.title || "").toLowerCase();
              return (slug && (slug === modeSlug || slug.includes(modeSlug))) ||
                (title && (title.includes(modeSlug) || title.includes(modeTitle)));
            })
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          // 3. แยกข้าง (ซ้าย/ขวา)
          const isItemRight = (item) => {
            const t = item.therapyTypes || {};
            const slug = (t.slug || "").toLowerCase();
            const title = (t.title || "").toLowerCase();
            return slug.includes('right') || title.includes('ขวา') || title.includes('right');
          };

          const rightHistory = modeHistory.filter(item => isItemRight(item));
          const leftHistory = modeHistory.filter(item => !isItemRight(item));

          const getBaseline = (history) => history
            .filter(item => {
              const category = (item.therapyTypes?.category || "").toLowerCase();
              const title = (item.therapyTypes?.title || "").toLowerCase();
              const slug = (item.therapyTypes?.slug || "").toLowerCase();
              const score = Number(item.score) || 0;

              const isTest = (category === 'daily' ||
                category === 'baseline' ||
                title.includes('ทดสอบ') ||
                title.includes('rom')) && score === 0;
              return isTest;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.angle || null;

          const rightBaseline = getBaseline(rightHistory);
          const leftBaseline = getBaseline(leftHistory);
          const generalBaseline = getBaseline(modeHistory);

          const rightSummary = getSideData(rightHistory, rightBaseline);
          const leftSummary = getSideData(leftHistory, leftBaseline);
          const generalSummary = getSideData(modeHistory, generalBaseline);

          let progressText = "";
          let progressEmoji = "💪";
          let encouragementText = "";

          if (!rightSummary && !leftSummary && !generalSummary) {
            progressText = "รอการพิชิตสถิติแรกของวัน";
            progressEmoji = "🎯";
            encouragementText = generalBaseline
              ? `ทดสอบมุมองศาเรียบร้อยแล้ว (${Math.round(generalBaseline)}°) มาเริ่มฝึกเพื่อไต่ระดับให้ถึงเป้าหมายกันเถอะ! 💪`
              : "มาเริ่มฝึกวันนี้เพื่อดูความก้าวหน้าของคุณกัน!";
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
            if (summaries.length === 0 && generalSummary) {
              const sign = generalSummary.percent >= 0 ? "+" : "";
              summaries.push(`เฉลี่ยรวม: ${Math.round(generalSummary.avg)}° (${sign}${Math.round(generalSummary.percent)}%)`);
            }
            progressText = summaries.join(" | ");

            const maxPercent = Math.max(rightSummary?.percent ?? -999, leftSummary?.percent ?? -999, generalSummary?.percent ?? -999);
            if (maxPercent > 10) { encouragementText = `สุดยอดมาก! พัฒนาขึ้นถึง ${Math.round(maxPercent)}% เลย เก่งที่สุดครับ! 🚀`; progressEmoji = "🚀"; }
            else if (maxPercent > 5) { encouragementText = `เยี่ยมเลยครับ! พัฒนาขึ้น ${Math.round(maxPercent)}% อย่างเห็นได้ชัด สู้ต่อไปนะ 🌟`; progressEmoji = "🌟"; }
            else if (maxPercent > 0) { encouragementText = `ดีมากครับ! มีการพัฒนาขึ้นเรื่อยๆ ร่างกายกำลังปรับตัวได้ดีเลย 👍`; progressEmoji = "✨"; }
            else if (maxPercent > -999) { encouragementText = "ไม่เป็นไรนะ วันนี้อาจจะเหนื่อยหน่อย พักผ่อนแล้วพรุ่งนี้มาฝึกใหม่นะครับ 💪"; progressEmoji = "👏"; }
            else { encouragementText = "พร้อมแล้วหรือยัง? มาเริ่มสร้างสถิติใหม่ของคุณวันนี้กันเถอะ! ✨"; progressEmoji = "🎯"; }

            totalImprovement += maxPercent > -999 ? maxPercent : 0;
            if (maxPercent > -999) modesWithData++;
          }

          let chartData = [];
          if (viewMode === "today") {
            const now = new Date();
            // ใช้ปี-เดือน-วันที่ เป็นตัวเปรียบเทียบ (แม่นยำกว่า string เปล่าๆ)
            const todayStr = now.toLocaleDateString('en-CA');
            
            const todayData = modeHistory.filter(item => {
              const itemDateStr = new Date(item.createdAt).toLocaleDateString('en-CA');
              return itemDateStr === todayStr;
            });

            chartData = todayData
              .filter(item => {
                const category = (item.therapyTypes?.category || "").toLowerCase();
                const title = (item.therapyTypes?.title || "").toLowerCase();
                const score = Number(item.score) || 0;

                // คัดเฉพาะที่เป็นการฝึกจริง (มี score หรือไม่ใช่ท่าทดสอบ)
                return score > 0 || !(category === 'daily' || category === 'baseline' || title.includes('ทดสอบ'));
              })
              .map((item, index) => {
                const isRight = isItemRight(item);
                const sideGoal = isRight ? (rightBaseline || generalBaseline) : (leftBaseline || generalBaseline);
                return {
                  time: `รอบ ${index + 1}`,
                  activeAngle: Number(item.angle) || 0,
                  dailyAngle: sideGoal || 0,
                  side: isRight ? 'ขวา' : 'ซ้าย'
                };
              });

            if (chartData.length === 0 && generalBaseline > 0) {
              chartData.push({ time: "เป้าหมาย", activeAngle: 0, dailyAngle: generalBaseline, isPlaceholder: true });
            }
          } else {
            const grouped = {};
            modeHistory.forEach(item => {
              const d = new Date(item.createdAt).toLocaleDateString('en-CA');
              if (!grouped[d]) grouped[d] = { dailyMax: 0, activeMax: 0 };
              const angle = Number(item.angle) || 0;
              const category = (item.therapyTypes?.category || "").toLowerCase();
              const title = (item.therapyTypes?.title || "").toLowerCase();
              const score = Number(item.score) || 0;

              if ((category === 'daily' || category === 'baseline' || title.includes('ทดสอบ')) && score === 0) {
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
            progressText, progressEmoji, encouragementText, chartData, rightSummary, leftSummary
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

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        Object.values(chartRefs.current).forEach(container => {
          if (container) {
            container.scrollLeft = container.scrollWidth;
          }
        });
      }, 300);
    }
  }, [loading, data, viewMode]);

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
      <div className="bg-white shadow-sm pt-8 pb-6 px-4 md:px-10 rounded-b-[40px] mb-8 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="self-start md:self-center p-3 rounded-full hover:bg-gray-50 transition-all border border-gray-200 shadow-sm flex items-center justify-center bg-white group hover:-translate-x-1"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 group-hover:text-[#40C9D5]" strokeWidth={2.5} />
          </button>

          <div className="text-center md:text-left flex-1 px-4">
            <h1 className="text-3xl font-extrabold text-[#344054] mb-2">สรุปผลการฟื้นฟูประจำวัน</h1>
            <p className="text-gray-500 font-medium text-sm md:text-base">ติดตามความก้าวหน้า และฉลองให้กับทุกๆ ข้อต่อที่ขยับได้ดีขึ้น</p>
          </div>

          <div className="bg-gradient-to-r from-[#40C9D5]/10 to-blue-500/10 border border-[#40C9D5]/20 rounded-2xl p-4 flex items-center gap-4 max-w-sm shadow-sm md:self-center w-full md:w-auto mt-4 md:mt-0">
            <div className="text-4xl">{overallProgress.emoji}</div>
            <div>
              <h3 className="font-bold text-[#344054] text-sm">ข้อความจากระบบ</h3>
              <p className="text-[#40C9D5] font-semibold text-sm leading-tight">{overallProgress.text}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 flex flex-col gap-8">
        <div className="flex justify-center md:justify-end shrink-0">
          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 inline-flex">
            <button onClick={() => setViewMode("today")} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "today" ? "bg-[#40C9D5] text-white shadow-md transform scale-105" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>ดูของวันนี้</button>
            <button onClick={() => setViewMode("all")} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "all" ? "bg-[#40C9D5] text-white shadow-md transform scale-105" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>ดูย้อนหลังทั้งหมด</button>
          </div>
        </div>

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
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${mode.color} text-white shadow-sm transform -rotate-3`}>{mode.icon}</div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{mode.title}</h2>
                      <p className="text-sm font-medium text-gray-500">{viewMode === 'today' ? 'ประทับใจของวันนี้' : 'สถิติที่ผ่านมา'}</p>
                    </div>
                  </div>

                  <div className={`h-[300px] w-full ${mode.bg} rounded-2xl p-4 relative mb-6 border border-white flex flex-col`}>
                    {chartData.length > 0 && (
                      <div className="flex justify-center items-center gap-6 mb-4 mt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mode.primary }}></div>
                          <span className="text-xs font-semibold text-[#4B5563]">{viewMode === "today" ? "ทำได้จริง (ฝึก)" : "ทำได้จริงสูงสุด/วัน"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mode.secondary }}></div>
                          <span className="text-xs font-semibold text-[#4B5563]">{viewMode === "today" ? "เป้าหมาย (ทดสอบ)" : "เป้าหมายสูงสุด/วัน"}</span>
                        </div>
                      </div>
                    )}

                    {chartData.length > 0 ? (
                      <div ref={el => chartRefs.current[mode.slug] = el} className="w-full flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scroll-smooth">
                        <div style={{ minWidth: `${Math.max(100, (chartData.length / 20) * 100)}%`, height: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={4} barSize={16}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                              <XAxis dataKey={viewMode === "today" ? "time" : "date"} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
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

                  <div className="bg-gray-50 rounded-2xl p-5 flex flex-col gap-4 border border-gray-100 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">ความก้าวหน้า (เฉลี่ย 5 รอบล่าสุด)</p>
                        <p className={`font-black text-lg leading-tight ${mode.text}`}>{mData.progressText || "ยังไม่มีข้อมูลการฝึก"}</p>
                      </div>
                      <div className="text-4xl ml-3 bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 transform rotate-3">{mData.progressEmoji || "💪"}</div>
                    </div>

                    <div className={`p-3 rounded-xl ${mode.bg} border border-white shadow-sm`}>
                      <p className={`font-bold text-sm ${mode.text} italic text-center`}>{mData.encouragementText || "มาเริ่มฝึกวันนี้เพื่อดูความก้าวหน้าของคุณกัน!"}</p>
                    </div>

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
                                <span className={`text-[11px] font-bold ${isUp ? 'text-green-500' : 'text-orange-500'}`}>{isUp ? '↑' : '↓'} {Math.abs(Math.round(summary.percent))}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 italic leading-tight">* เปรียบเทียบกับค่า Baseline จากการทดสอบ ROM รายวันครั้งล่าสุด</p>
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
