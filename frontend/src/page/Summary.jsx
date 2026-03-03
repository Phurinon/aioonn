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
              let action = 'shoulder-flexion';
              if (s.includes('abduction') || s.includes('กาง')) action = 'shoulder-abduction';
              else if (s.includes('external') || s.includes('หมุน') || s.includes('rotation')) action = 'elbow-rotation';
              
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

            chartData = todayData.map((item, index) => {
              const d = new Date(item.createdAt);
              const isDaily = item.therapyTypes?.category?.toLowerCase() === 'daily';
              return {
                time: `${d.toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} (รอบ ${index + 1})`,
                activeAngle: isDaily ? null : (item.angle ? Number(item.angle) : 0),
                dailyAngle: isDaily ? (item.angle ? Number(item.angle) : 0) : null,
              };
            });
          } else {
            const grouped = {};
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
            chartData = Object.values(grouped)
              .sort((a, b) => a.rawDate - b.rawDate)
              .map((item) => ({
                date: item.rawDate.toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                }),
                activeMaxAngle: item.activeMaxAngle,
                dailyMaxAngle: item.dailyMaxAngle,
              }));
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
      <div className="flex justify-center items-center">
        <div className="p-3 text-2xl font-bold mt-10 border-2 border-black rounded-full shadow-md bg-white">
          {viewMode === "today"
            ? "สรุปผลการออกกำลังกายวันนี้"
            : "สรุปผลการออกกำลังกายทั้งหมด"}
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
                                  strokeWidth={3}
                                  activeDot={{ r: 8 }}
                                  dot={{ r: 4, strokeWidth: 2 }}
                                  connectNulls={true}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="dailyAngle"
                                  name="มุมจากการทดสอบ (องศา)"
                                  stroke="#FF4560"
                                  strokeWidth={3}
                                  strokeDasharray="5 5"
                                  activeDot={{ r: 8 }}
                                  dot={{ r: 6, strokeWidth: 2 }}
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
                                  strokeWidth={3}
                                  activeDot={{ r: 8 }}
                                  dot={{ r: 4, strokeWidth: 2 }}
                                  connectNulls={true}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="dailyMaxAngle"
                                  name="ทดสอบสูงสุด (องศา)"
                                  stroke="#FF4560"
                                  strokeWidth={3}
                                  strokeDasharray="5 5"
                                  activeDot={{ r: 8 }}
                                  dot={{ r: 6, strokeWidth: 2 }}
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
