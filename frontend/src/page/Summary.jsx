import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTherapyHistoryByUserId } from "../Functions/therapy";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const activeModes = [
  { slug: 'shoulder-flexion', title: 'ยกแขนด้านหน้า', color: 'bg-blue-100', text: 'text-blue-600', stroke: '#3B82F6' },
  { slug: 'shoulder-abduction', title: 'ยกแขนด้านข้าง', color: 'bg-green-100', text: 'text-green-600', stroke: '#10B981' },
  { slug: 'elbow-rotation', title: 'หมุนศอก', color: 'bg-yellow-100', text: 'text-yellow-600', stroke: '#F59E0B' },
];

function Summary() {
  const { patientId } = useParams();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("today"); // 'today' | 'all'

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

        activeModes.forEach((mode) => {
          // Filter history for this specific mode
          const modeHistory = targetHistory.filter((item) => {
            const t = item.therapyTypes;
            if (!t) return false;
            // Matches Active Exercise
            if (t.slug === mode.slug && t.category?.toLowerCase() !== 'daily') return true;
             // Matches Daily Test
            if (t.category?.toLowerCase() === 'daily') {
              const s = (t.slug || t.title || '').toLowerCase();
              let action = '';
              if (s.includes('flexion') || s.includes('ยกแขน') && s.includes('หน้า')) action = 'shoulder-flexion';
              if (s.includes('abduction') || s.includes('กาง')) action = 'shoulder-abduction';
              else if (s.includes('external') || s.includes('หมุน') || s.includes('rotation')) action = 'elbow-rotation';
              
              if (!action) action = 'shoulder-flexion'; // fallback
              return action === mode.slug;
            }
            return false;
          });

          const groupedActiveByDate = {};
          const groupedDailyByDate = {};

          modeHistory.forEach((item) => {
            if (!item.angle) return;
            const isDaily = item.therapyTypes?.category?.toLowerCase() === 'daily';
            const dateKey = new Date(item.createdAt).toISOString().split("T")[0];
            const angle = Number(item.angle);
            
            if (isDaily) {
                if (!groupedDailyByDate[dateKey]) groupedDailyByDate[dateKey] = angle;
                else groupedDailyByDate[dateKey] = Math.max(groupedDailyByDate[dateKey], angle);
            } else {
                if (!groupedActiveByDate[dateKey]) groupedActiveByDate[dateKey] = angle;
                else groupedActiveByDate[dateKey] = Math.max(groupedActiveByDate[dateKey], angle);
            }
          });

          // Calculate progress for left bar
          let progressText = "ไม่มีข้อมูล";
          let currentActiveMax = 0;
          let currentDailyMax = 0;

          const allDates = [...new Set([...Object.keys(groupedActiveByDate), ...Object.keys(groupedDailyByDate)])].sort();
          if (allDates.length > 0) {
            const latestDate = allDates[allDates.length - 1];
            currentActiveMax = groupedActiveByDate[latestDate] || 0;
            currentDailyMax = groupedDailyByDate[latestDate] || 0;

            if (currentActiveMax > 0 && currentDailyMax > 0) {
                if (currentActiveMax > currentDailyMax + 5) {
                    progressText = `ฝึกได้ดีกว่าแบบทดสอบ (+${Math.round(currentActiveMax - currentDailyMax)}°) 🎉`;
                } else if (currentActiveMax >= currentDailyMax) {
                    progressText = `ฝึกได้ดีกว่าหรือเท่ากับแบบทดสอบ 👍`;
                } else {
                    progressText = `ยังฝึกได้น้อยกว่าแบบทดสอบ (${Math.round(currentActiveMax - currentDailyMax)}°) 📉`;
                }
            } else if (currentActiveMax > 0 && currentDailyMax === 0) {
                const datesActive = Object.keys(groupedActiveByDate).sort();
                if (datesActive.length > 1) {
                    const prevMax = groupedActiveByDate[datesActive[datesActive.length - 2]];
                    if (currentActiveMax > prevMax + 5) {
                        progressText = "พัฒนาการดีขึ้นมาก 📈";
                    } else if (currentActiveMax >= prevMax) {
                        progressText = "พัฒนาการคงที่ ดีขึ้น 📈";
                    } else {
                        progressText = "ควรฝึกเพิ่มเติม 📉";
                    }
                } else {
                    progressText = "กำลังเริ่มต้นฝึก (ไม่มีผลทดสอบรายวัน)";
                }
            } else if (currentDailyMax > 0 && currentActiveMax === 0) {
                progressText = "ทำแบบทดสอบแล้ว รอการฝึก 💪";
            }
          }

          // Format data for chart
          let chartData = [];
          
          if (viewMode === "today") {
            const today = new Date();
            const todayData = modeHistory.filter((item) => {
              const d = new Date(item.createdAt);
              return (
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear()
              );
            }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            // Find daily max for today to make a flat line
            let tDailyMax = null;
            todayData.forEach(item => {
                if (item.therapyTypes?.category?.toLowerCase() === 'daily' && item.angle) {
                    const angle = Number(item.angle);
                    tDailyMax = tDailyMax === null ? angle : Math.max(tDailyMax, angle);
                }
            });

            // Extract just the active exercises to plot over time
            const activeData = todayData.filter(item => item.therapyTypes?.category?.toLowerCase() !== 'daily');

            if (activeData.length === 0 && tDailyMax !== null) {
                // If only daily test exists today, draw two spanning points
                chartData = [
                    { time: "เริ่ม", activeAngle: null, dailyAngle: tDailyMax },
                    { time: "จบ", activeAngle: null, dailyAngle: tDailyMax }
                ];
            } else {
                chartData = activeData.map((item, index) => {
                  const d = new Date(item.createdAt);
                  return {
                    time: `${d.toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} (รอบ ${index + 1})`,
                    activeAngle: item.angle ? Number(item.angle) : 0,
                    dailyAngle: tDailyMax, // Flat line across all points
                  };
                });
            }

          } else {
            const grouped = {};
            let aDailyMax = null; // Global max for all time, or max per day based on preference. Let's do max per day for now, or global? Flat line usually means a global max across the view, but let's do max per day first so it forms a daily step progression or flat.
            
            // Let's find global daily max first if we want a single straight line, but user said "like test line" which implies it might step up per day. 
            // We'll track per day active max, and per day daily max.
            
            modeHistory.forEach((item) => {
              if (!item.angle) return;
              const d = new Date(item.createdAt);
              const dateKey = d.toISOString().split("T")[0];
              const angle = Number(item.angle);
              const isDaily = item.therapyTypes?.category?.toLowerCase() === 'daily';

              if (!grouped[dateKey]) {
                grouped[dateKey] = { rawDate: d, activeMaxAngle: null, dailyMaxAngle: null };
              }
              if (isDaily) {
                grouped[dateKey].dailyMaxAngle = grouped[dateKey].dailyMaxAngle === null 
                  ? angle 
                  : Math.max(grouped[dateKey].dailyMaxAngle, angle);
              } else {
                grouped[dateKey].activeMaxAngle = grouped[dateKey].activeMaxAngle === null 
                  ? angle 
                  : Math.max(grouped[dateKey].activeMaxAngle, angle);
              }
            });
            
            // Propagate daily max forward so it acts as a flat continuous line even on days without a test
            let lastKnownDaily = null;
            const sortedKeys = Object.values(grouped).sort((a, b) => a.rawDate - b.rawDate);
            
            chartData = sortedKeys.map((item) => {
                if (item.dailyMaxAngle !== null) lastKnownDaily = item.dailyMaxAngle;
                
                return {
                    date: item.rawDate.toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    }),
                    activeMaxAngle: item.activeMaxAngle,
                    dailyMaxAngle: lastKnownDaily, // Use last known to make it a continuous target line
                };
            });
          }

          newModeData[mode.slug] = {
            progressText,
            currentActiveMax,
            currentDailyMax,
            chartData,
          };
        });

        setData(newModeData);
      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, viewMode]);

  return (
    <div className="bg-[#F3FBFC] min-h-screen pb-10">
      <div className="container mx-auto px-10 pt-10 flex items-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-10 p-3 rounded-full hover:bg-gray-100 shadow-md transition-all border-2 border-black flex items-center justify-center bg-white z-10 hover:scale-105"
        >
          <ArrowLeftIcon className="w-6 h-6 text-black" strokeWidth={2.5} />
        </button>
        <div className="w-full flex justify-center items-center">
          <div className="p-3 px-6 text-2xl font-bold border-2 border-black rounded-full shadow-md bg-white">
            {viewMode === "today"
              ? "สรุปผลการออกกำลังกายวันนี้"
              : "สรุปผลการออกกำลังกายทั้งหมด"}
          </div>
        </div>
      </div>

      {/* Main Layout: Flex Row for Side-by-Side */}
      <div className="container mx-auto px-10 my-10 flex flex-col lg:flex-row gap-8">
        {/* Left Column: Score Cards */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {activeModes.map((mode) => {
            const mData = data[mode.slug];
            return (
              <div
                key={mode.slug}
                className={`p-6 text-start font-bold ${mode.color} rounded-2xl shadow-sm`}
              >
                <div className="text-xl mb-2">{mode.title}</div>
                <div className="text-sm text-gray-700 mb-1">
                  แบบทดสอบรายวันล่าสุด: {mData && mData.currentDailyMax > 0 ? `${Math.round(mData.currentDailyMax)}°` : '-'}
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  การฝึกปกติล่าสุด: {mData && mData.currentActiveMax > 0 ? `${Math.round(mData.currentActiveMax)}°` : '-'}
                </div>
                <div
                  className={`text-center text-xl font-extrabold ${mode.text} mt-2`}
                >
                  {mData ? mData.progressText : "ไม่มีข้อมูล"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Graphs */}
        <div className="w-full lg:w-2/3 bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex flex-col">
          {/* View Mode Toggle */}
          <div className="flex justify-end mb-4 shrink-0">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setViewMode("today")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "today"
                    ? "bg-white text-[#40C9D5] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                วันนี้
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "all"
                    ? "bg-white text-[#40C9D5] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                ทั้งหมด
              </button>
            </div>
          </div>

          {/* Graphs Section */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {loading ? (
              <div className="text-gray-400 text-center py-10">
                กำลังโหลดข้อมูล...
              </div>
            ) : (
              activeModes.map((mode) => {
                const mData = data[mode.slug];
                const chartData = mData?.chartData || [];

                return (
                  <div
                    key={mode.slug}
                    className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-4"
                  >
                    <h4 className="text-center font-bold text-gray-600 mb-4">
                      {mode.title}
                    </h4>
                    {chartData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#E5E7EB"
                            />
                            <XAxis
                              dataKey={viewMode === "today" ? "time" : "date"}
                              stroke="#9CA3AF"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => {
                                if (typeof value === 'string' && value.includes(' (รอบ')) {
                                  return value.split(' ')[0];
                                }
                                return value;
                              }}
                            />
                            <YAxis
                              stroke="#9CA3AF"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#fff",
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              }}
                            />
                            <Legend />
                            {viewMode === "today" ? (
                              <>
                                <Line
                                  type="monotone"
                                  dataKey="activeAngle"
                                  name="มุมจากการฝึก (องศา)"
                                  stroke={mode.stroke}
                                  strokeWidth={4}
                                  activeDot={{ r: 8 }}
                                  dot={{ r: 4, strokeWidth: 2 }}
                                  connectNulls={true}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="dailyAngle"
                                  name="มุมจากการทดสอบ (องศา)"
                                  stroke="#FF4560"
                                  strokeWidth={4}
                                  strokeDasharray="5 5"
                                  activeDot={false}
                                  dot={false}
                                  connectNulls={true}
                                />
                              </>
                            ) : (
                              <>
                                <Line
                                  type="monotone"
                                  dataKey="activeMaxAngle"
                                  name="ฝึกปกติสูงสุด (องศา)"
                                  stroke={mode.stroke}
                                  strokeWidth={4}
                                  activeDot={{ r: 8 }}
                                  dot={{ r: 4, strokeWidth: 2 }}
                                  connectNulls={true}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="dailyMaxAngle"
                                  name="ทดสอบสูงสุด (องศา)"
                                  stroke="#FF4560"
                                  strokeWidth={4}
                                  strokeDasharray="5 5"
                                  activeDot={false}
                                  dot={false}
                                  connectNulls={true}
                                />
                              </>
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm font-medium">ยังไม่มีข้อมูล</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;
