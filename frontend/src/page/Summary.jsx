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

function Summary() {
  const { patientId } = useParams();
  const [data, setData] = useState([]);
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
        const history = response.data.data;

        // Filter by patientId if provided
        let targetHistory = history;
        if (patientId) {
          targetHistory = history.filter(
            (item) => item.patientId === Number(patientId),
          );
        }

        let formattedData = [];

        if (viewMode === "today") {
          // Filter for today's data
          const today = new Date();
          const todayData = targetHistory.filter((item) => {
            const itemDate = new Date(item.createdAt);
            return (
              itemDate.getDate() === today.getDate() &&
              itemDate.getMonth() === today.getMonth() &&
              itemDate.getFullYear() === today.getFullYear()
            );
          });

          // Sort by time ascending
          todayData.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
          );

          formattedData = todayData.map((item) => ({
            time: new Date(item.createdAt).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            angle: item.angle ? Number(item.angle) : 0,
            score: item.score ? Number(item.score) : 0,
            type: item.therapyTypes ? item.therapyTypes.title : "Unknown",
          }));
        } else {
          // Group by date and find max angle
          const groupedByDate = {};
          targetHistory.forEach((item) => {
            if (!item.angle) return;
            const dateObj = new Date(item.createdAt);
            const dateKey = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
            const angle = Number(item.angle);

            if (!groupedByDate[dateKey]) {
              groupedByDate[dateKey] = {
                rawDate: dateObj,
                maxAngle: angle,
              };
            } else {
              if (angle > groupedByDate[dateKey].maxAngle) {
                groupedByDate[dateKey].maxAngle = angle;
              }
            }
          });

          // Convert to array and sort by date ascending
          const sortedData = Object.values(groupedByDate).sort(
            (a, b) => a.rawDate - b.rawDate,
          );

          formattedData = sortedData.map((item) => ({
            date: item.rawDate.toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
            }),
            maxAngle: item.maxAngle,
          }));
        }

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, viewMode]);

  return (
    <div>
      <div className="bg-[#F3FBFC] h-screen">
        <div className="flex justify-center items-center">
          {/* <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border border-[#40C9D5] text-[#40C9D5] rounded-lg hover:bg-[#40C9D5] hover:text-white transition-all font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            ย้อนกลับ
          </button> */}
          <div className="p-3 text-2xl font-bold mt-10 border-2 border-black rounded-full shadow-md bg-white">
            {viewMode === "today"
              ? "สรุปผลการออกกำลังกายวันนี้"
              : "สรุปผลการออกกำลังกายทั้งหมด"}
          </div>
        </div>

        {/* Main Layout: Flex Row for Side-by-Side */}
        <div className="container mx-auto px-10 my-10 flex flex-row gap-8">
          {/* Left Column: Score Cards */}
          <div className="w-1/3 flex flex-col gap-6">
            <div className="p-6 text-start font-bold bg-blue-100 rounded-2xl shadow-sm">
              <div className="text-xl mb-2">ยกแขนด้านหน้า</div>
              <div className="text-center text-3xl font-extrabold text-green-600 mt-2">
                ดีขึ้น
              </div>
            </div>
            <div className="p-6 text-start font-bold bg-green-100 rounded-2xl shadow-sm">
              <div className="text-xl mb-2">ยกแขนด้านข้าง</div>
              <div className="text-center text-3xl font-extrabold text-green-600 mt-2">
                ดีขึ้น
              </div>
            </div>
            <div className="p-6 text-start font-bold bg-yellow-100 rounded-2xl shadow-sm">
              <div className="text-xl mb-2">หมุนศอก</div>
              <div className="text-center text-3xl font-extrabold mt-2">
                คงที่
              </div>
            </div>
          </div>

          {/* Right Column: Graph & Summary Text */}
          <div className="w-2/3 bg-white rounded-3xl p-8 shadow-lg border border-gray-100 flex flex-col">
            {/* View Mode Toggle */}
            <div className="flex justify-end mb-4">
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

            {/* Graph Section */}
            <div className="flex-1 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 min-h-[300px] mb-6 overflow-hidden relative">
              {loading ? (
                <div className="text-gray-400">กำลังโหลดข้อมูล...</div>
              ) : data.length > 0 ? (
                <div className="w-full h-full p-4">
                  <h4 className="text-center mb-2 font-bold text-gray-500">
                    {viewMode === "today"
                      ? "กราฟพัฒนาการวันนี้"
                      : "กราฟพัฒนาการองศาการเคลื่อนไหว (สูงสุดต่อวัน)"}
                  </h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 35,
                      }}
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
                            dataKey="angle"
                            name="มุม (องศา)"
                            stroke="#40C9D5"
                            strokeWidth={3}
                            activeDot={{ r: 8 }}
                            dot={{ r: 4, strokeWidth: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            name="จำนวน (ครั้ง)"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                          />
                        </>
                      ) : (
                        <Line
                          type="monotone"
                          dataKey="maxAngle"
                          name="มุมสูงสุด (องศา)"
                          stroke="#40C9D5"
                          strokeWidth={3}
                          activeDot={{ r: 8 }}
                          dot={{ r: 4, strokeWidth: 2 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p className="text-lg font-medium">
                    {viewMode === "today"
                      ? "ไม่มีข้อมูลการออกกำลังกายวันนี้"
                      : "ไม่มีข้อมูลประวัติการรักษา"}
                  </p>
                  <p className="text-sm">
                    เริ่มออกกำลังกายเพื่อดูพัฒนาการของคุณ
                  </p>
                </div>
              )}
            </div>

            {/* Text Summary */}
            <div className="mt-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                สรุปผลวันนี้
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {data.length > 0
                  ? "คุณมีการพัฒนาที่ดีขึ้นอย่างต่อเนื่อง พยายามรักษาความสม่ำเสมอในการฝึกฝน"
                  : "ยังไม่มีข้อมูลสำหรับวันนี้ กรุณาเริ่มการฝึกเพื่อดูผลลัพธ์"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;
