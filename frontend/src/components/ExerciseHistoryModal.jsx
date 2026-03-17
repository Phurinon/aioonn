import React from "react";
import {
  XMarkIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

/**
 * ExerciseHistoryModal - Shared modal for displaying exercise session history
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to close the modal
 * @param {Array} history - Array of session records
 * @param {string} exerciseName - Display name of the exercise (e.g., "ยกแขนด้วยตัวเอง")
 * @param {string} exerciseIcon - Emoji icon for the exercise
 */
export default function ExerciseHistoryModal({
  isOpen,
  onClose,
  history = [],
  exerciseName = "กิจกรรม",
  exerciseIcon = "📊",
}) {
  if (!isOpen) return null;

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Format date/time for display
  const formatDateTime = (date) => {
    return new Date(date).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Render session stats based on available data
  const renderSessionStats = (session) => {
    const stats = [];

    // Average Angle (if available)
    if (session.avgAngle !== undefined) {
      stats.push(
        <div
          key="avgAngle"
          className="bg-white rounded-xl p-3 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-[#FFF4E5] rounded-lg flex items-center justify-center text-lg">
            🎯
          </div>
          <div>
            <div className="text-xs text-[#7E8C94]">ค่าเฉลี่ยองศา</div>
            <div className="text-sm font-semibold text-[#FF9500]">{session.avgAngle}°</div>
          </div>
        </div>
      );
    }

    // Max Angle (if available)
    const angle = session.maxAngle || session.angle;
    if (angle) {
      stats.push(
        <div
          key="maxAngle"
          className="bg-white rounded-xl p-3 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-[#FFF4E5] rounded-lg flex items-center justify-center text-lg">
            📐
          </div>
          <div>
            <div className="text-xs text-[#7E8C94]">องศาสูงสุด</div>
            <div className="text-sm font-semibold text-[#344054]">{angle}°</div>
          </div>
        </div>
      );
    }

    // Duration (always show)
    if (session.targetDuration) {
      // Timer mode - show achieved/target
      stats.push(
        <div
          key="duration"
          className="bg-white rounded-xl p-3 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-[#F0E8FF] rounded-lg flex items-center justify-center">
            <ClockIcon className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div>
            <div className="text-xs text-[#7E8C94]">เวลา</div>
            <div className="text-sm font-semibold text-[#344054]">
              {formatTime(session.duration || 0)}/
              {formatTime(session.targetDuration)}
            </div>
          </div>
        </div>
      );
    } else {
      // Normal mode - show duration only
      stats.push(
        <div
          key="duration"
          className="bg-white rounded-xl p-3 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-[#F0E8FF] rounded-lg flex items-center justify-center">
            <ClockIcon className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div>
            <div className="text-xs text-[#7E8C94]">เวลา</div>
            <div className="text-sm font-semibold text-[#344054]">
              {formatTime(session.duration || 0)}
            </div>
          </div>
        </div>
      );
    }

    // Count (if available)
    if (session.count !== undefined) {
      stats.push(
        <div
          key="count"
          className="bg-white rounded-xl p-3 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-[#E8F8FA] rounded-lg flex items-center justify-center text-lg">
            🔢
          </div>
          <div>
            <div className="text-xs text-[#7E8C94]">จำนวนครั้ง</div>
            <div className="text-sm font-semibold text-[#344054]">
              {session.targetCount
                ? `${session.count}/${session.targetCount} ครั้ง`
                : `${session.count} ครั้ง`}
            </div>
          </div>
        </div>
      );
    }

    // Weight (if available)
    if (session.weight) {
      stats.push(
        <div
          key="weight"
          className="bg-white rounded-xl p-3 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-lg">
            🏋️
          </div>
          <div>
            <div className="text-xs text-[#7E8C94]">น้ำหนัก</div>
            <div className="text-sm font-semibold text-[#344054]">
              {session.weight} กก.
            </div>
          </div>
        </div>
      );
    }

    // Max angle is already handled at the beginning

    // Score (if available)
    if (session.score) {
      stats.push(
        <div
          key="score"
          className="bg-white rounded-xl p-3 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-[#FFF4E5] rounded-lg flex items-center justify-center text-lg">
            ⭐
          </div>
          <div>
            <div className="text-xs text-[#7E8C94]">คะแนน</div>
            <div className="text-sm font-semibold text-[#344054]">
              {session.score}/100
            </div>
          </div>
        </div>
      );
    }

    return stats;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E8F8FA] rounded-full flex items-center justify-center text-2xl">
                {exerciseIcon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#344054]">
                  สรุปผลการเล่น
                </h2>
                <p className="text-sm text-[#7E8C94]">{exerciseName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-[#F3FBFC] rounded-full flex items-center justify-center text-4xl mb-4">
                📋
              </div>
              <h3 className="text-lg font-semibold text-[#344054] mb-2">
                ยังไม่มีผลการเล่น
              </h3>
              <p className="text-[#7E8C94] text-sm text-center max-w-xs">
                เริ่มเล่นกิจกรรมเพื่อบันทึกประวัติการฝึก
              </p>
            </div>
          ) : (
            /* History List */
            <div className="space-y-4">
              {/* Overall Summary Card */}
              <div className="bg-[#FFF4E5] rounded-2xl p-4 border border-[#FFE0A7] flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                  🎯
                </div>
                <div>
                  <div className="text-sm text-[#FF9500] font-medium">
                    ค่าเฉลี่ยองศารวมทั้งหมด
                  </div>
                  <div className="text-2xl font-bold text-[#FF9500]">
                    {Math.round(
                      history.reduce((sum, session) => sum + (session.avgAngle || session.maxAngle || session.angle || 0), 0) /
                      (history.length || 1)
                    )}°
                  </div>
                </div>
              </div>

              {/* Individual Sessions */}
              <div className="space-y-3">
                {history.map((session, index) => (
                  <div
                    key={session.id || index}
                    className="bg-[#F3FBFC] rounded-2xl p-4 border border-[#E8F8FA]"
                  >
                    {/* Session Header */}
                    <div className="flex items-center justify-between mb-3 border-b border-[#E8F8FA] pb-2">
                      <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#40C9D5]">
                            รอบที่ {history.length - index}
                          </span>
                          {session.armType && (
                              <span className="text-xs px-2 py-0.5 bg-white text-[#7E8C94] rounded-full border border-gray-100">
                                  แขน{session.armType === 'right' ? 'ขวา' : 'ซ้าย'}
                              </span>
                          )}
                      </div>
                      <span className="text-xs text-[#7E8C94]">
                        {formatDateTime(session.timestamp)}
                      </span>
                    </div>

                    {/* Session Stats - Dynamic Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {renderSessionStats(session)}
                    </div>

                    {/* Note or Status (if available) */}
                    {(session.note ||
                      session.stability ||
                      session.alignment ||
                      session.flexibility) && (
                      <div className="mt-3 pt-3 border-t border-[#E8F8FA]">
                        <div className="text-sm text-[#7E8C94]">
                          {session.stability && (
                            <span className="mr-2">🎯 {session.stability}</span>
                          )}
                          {session.alignment && (
                            <span className="mr-2">📏 {session.alignment}</span>
                          )}
                          {session.flexibility && (
                            <span className="mr-2">🤸 {session.flexibility}</span>
                          )}
                          {session.note && <span>{session.note}</span>}
                        </div>
                      </div>
                    )}

                    {/* Target info (if available) */}
                    {session.targetCount && (
                      <div className="mt-3 pt-3 border-t border-[#E8F8FA]">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#7E8C94]">เป้าหมาย</span>
                          <span
                            className={`font-semibold ${
                              session.count >= session.targetCount
                                ? "text-green-500"
                                : "text-orange-500"
                            }`}
                          >
                            {session.count >= session.targetCount
                              ? "✓ สำเร็จ"
                              : "✗ ไม่ถึงเป้า"}
                            <span className="text-[#7E8C94] font-normal ml-1">
                              ({session.count}/{session.targetCount})
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#40C9D5] text-white font-semibold rounded-xl hover:bg-[#2BA8B4] transition shadow-md"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
