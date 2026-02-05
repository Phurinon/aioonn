import React, { useEffect, useRef, useState } from "react";

export default function StatsRecorder({ angle }) {
  const [lastRep, setLastRep] = useState(null);
  const [holdTime, setHoldTime] = useState(0);

  const repState = useRef("down");
  // states: "down" → "holding" → "ready" → "recording"

  const angleBuffer = useRef([]);

  const HOLD_ANGLE = 30; // มุมที่ถือว่าเริ่มยกแขน
  const REQUIRED_HOLD_SECONDS = 9.9;

  useEffect(() => {
    if (angle == null) return;

    // 1) เมื่อมุม > HOLD_ANGLE → เริ่มจับเวลา
    if (angle > HOLD_ANGLE) {
      // เริ่มยกขึ้นครั้งแรก
      if (repState.current === "down") {
        repState.current = "holding";
        setHoldTime(0);
      }

      // ถ้ายังอยู่ในสเตจ holding → เพิ่มเวลา
      if (repState.current === "holding") {
        setHoldTime((prev) => {
          const newTime = prev + 0.1;

          // ครบ 3 วิ → พร้อมเริ่มบันทึกมุมสูงสุด
          if (newTime >= REQUIRED_HOLD_SECONDS) {
            repState.current = "ready";
            angleBuffer.current = []; // reset buffer
          }

          return newTime;
        });
      }

      // 2) เมื่อพร้อมบันทึก (ready) → เก็บมุมทุกเฟรม
      if (repState.current === "ready") {
        repState.current = "recording";
      }

      if (repState.current === "recording") {
        angleBuffer.current.push(angle);
      }
    }

    // 3) เมื่อแขนลงต่ำ < 70° → จบรอบ
    else {
      if (repState.current === "recording") {
        const maxA = Math.max(...angleBuffer.current);
        const minA = Math.min(...angleBuffer.current);
        const time = new Date().toLocaleTimeString();

        // บันทึกรอบล่าสุด
        setLastRep({
          maxAngle: maxA.toFixed(1),
          minAngle: minA.toFixed(1),
          time,
        });
      }

      // reset state
      repState.current = "down";
      angleBuffer.current = [];
      setHoldTime(0);
    }
  }, [angle]);

  return (
    <div style={{ marginTop: "50px", color: "black" }}>
      {/* <h3>รอบล่าสุด</h3> */}

      {lastRep ? (
        <div>
          <div>มุมสูงสุด: {lastRep.maxAngle}°</div>
          {/* <div>มุมต่ำสุด: {lastRep.minAngle}°</div> */}
          {/* <div>เวลา: {lastRep.time}</div> */}
        </div>
      ) : (
        <div>ยังไม่มีข้อมูลรอบ</div>
      )}

      <div style={{ marginTop: "10px", fontSize: "14px" }}>
        เวลาที่ยกแขนค้าง: {holdTime.toFixed(1)} s
      </div>
    </div>
  );
}
