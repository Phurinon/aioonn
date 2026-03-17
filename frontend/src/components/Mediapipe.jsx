import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import StatsRecorder from "./StatsRecorder";
import usePersonTracking from "../hooks/usePersonTracking";

const Mediapipe = forwardRef(function Mediapipe(
  {
    mode = "solo", // "solo" หรือ "assisted"
    enableCounting = false, // เปิด/ปิดการนับจำนวนครั้ง
    showCountOverlay = false, // แสดง count overlay ใน component หรือไม่ (default ปิด ให้หน้าจัดการเอง)
    angleThreshold = 135, // องศาที่ต้องยกถึง (default 135)
    onAngleUpdate = null, // Callback sending { right, left } angles
    trackingMode = "shoulder", // "shoulder" or "elbow"
    trackedSide = "right", // "left", "right", or "both"
  },
  ref
) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState("waiting"); // "waiting", "pending", "locked"
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // นับจำนวนครั้งที่ยกแขน
  const [armRaiseCount, setArmRaiseCount] = useState(0);
  const armWasDownRef = useRef(true); // ต้องลงก่อนจึงนับใหม่ได้
  // const ANGLE_THRESHOLD = 135; // Moved to props

  // Refs to hold latest prop values for use inside closure
  const angleThresholdRef = useRef(angleThreshold);
  const enableCountingRef = useRef(enableCounting);
  const trackedSideRef = useRef(trackedSide);
  const trackingModeRef = useRef(trackingMode);
  const onAngleUpdateRef = useRef(onAngleUpdate);

  useEffect(() => {
    angleThresholdRef.current = angleThreshold;
    enableCountingRef.current = enableCounting;
    trackedSideRef.current = trackedSide;
    trackingModeRef.current = trackingMode;
    onAngleUpdateRef.current = onAngleUpdate;
  }, [angleThreshold, enableCounting, trackedSide, trackingMode, onAngleUpdate]);

  // Person tracking hook สำหรับ assisted mode
  const {
    isLocked,
    personLost,
    lockPerson,
    unlockPerson,
    checkTargetPerson,
    getLockedBoundingBox,
  } = usePersonTracking();

  // เก็บ landmarks ล่าสุดเพื่อใช้ใน lockCurrentPerson
  const lastLandmarksRef = useRef(null);

  // Track max angle for the session
  const maxSessionAngleRef = useRef(0);
  const currentRealtimeAngleRef = useRef(0);

  // Track average angle variables
  const sumRepAnglesRef = useRef(0);
  const completedRepsForAvgRef = useRef(0);
  const currentRepMaxAngleRef = useRef(0);

  // State สำหรับรอ lock คนแรกที่เจอ
  const pendingLockRef = useRef(false);

  // FPS Calculation state
  const [fps, setFps] = useState(0);
  const fpsRef = useRef(0);
  const lastFpsTimeRef = useRef(0);

  const width = 1080;
  const height = 640;

  // Expose methods ให้ parent component เรียกใช้ได้
  useImperativeHandle(ref, () => ({
    lockCurrentPerson: () => {
      // ถ้ามี landmarks อยู่แล้ว lock เลย
      if (lastLandmarksRef.current) {
        const success = lockPerson(lastLandmarksRef.current);
        if (success) {
          setTrackingStatus("locked");
          pendingLockRef.current = false;
          setArmRaiseCount(0); // reset count เมื่อเริ่มใหม่
          maxSessionAngleRef.current = 0; // reset angle
          armWasDownRef.current = true;
          return true;
        }
      }
      // ถ้ายังไม่มี landmarks → ตั้งเป็น pending รอ lock คนแรกที่เจอ
      pendingLockRef.current = true;
      setTrackingStatus("pending");
      setArmRaiseCount(0); // reset count เมื่อเริ่มใหม่
      maxSessionAngleRef.current = 0; // reset angle
      sumRepAnglesRef.current = 0; // reset average sum
      completedRepsForAvgRef.current = 0; // reset average count
      currentRepMaxAngleRef.current = 0; // reset current rep max
      armWasDownRef.current = true;
      return true; // return true เพื่อให้ UI เปลี่ยนเป็นโหมดติดตาม
    },
    unlockPerson: () => {
      unlockPerson();
      pendingLockRef.current = false;
      setTrackingStatus("waiting");
    },
    isLocked: () => isLocked || pendingLockRef.current,
    getArmRaiseCount: () => armRaiseCount,
    getAngle: () => Math.round(maxSessionAngleRef.current),
    getRealtimeAngle: () => Math.round(currentRealtimeAngleRef.current),
    getAverageAngle: () => {
        // If a rep is currently active, include it in the average
        let totalSum = sumRepAnglesRef.current;
        let totalReps = completedRepsForAvgRef.current;
        if (!armWasDownRef.current && currentRepMaxAngleRef.current > 0) {
            totalSum += currentRepMaxAngleRef.current;
            totalReps += 1;
        }
        if (totalReps === 0) return 0;
        return Math.round(totalSum / totalReps);
    },
    resetCount: () => {
      setArmRaiseCount(0);
      maxSessionAngleRef.current = 0;
      sumRepAnglesRef.current = 0;
      completedRepsForAvgRef.current = 0;
      currentRepMaxAngleRef.current = 0;
      armWasDownRef.current = true;
    },
  }));

  // No longer need personLost notification - simplified to just lock/unlock

  function calculateAngle(A, B, C) {
    const BA = { x: A.x - B.x, y: A.y - B.y };
    const BC = { x: C.x - B.x, y: C.y - B.y };

    const dotProduct = BA.x * BC.x + BA.y * BC.y;
    const magnitudeBA = Math.sqrt(BA.x ** 2 + BA.y ** 2);
    const magnitudeBC = Math.sqrt(BC.x ** 2 + BC.y ** 2);

    if (magnitudeBA === 0 || magnitudeBC === 0) return null;

    const angleRad = Math.acos(dotProduct / (magnitudeBA * magnitudeBC));
    return (angleRad * 180) / Math.PI;
  }

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);

    let camera = null;
    let isMounted = true;

    // Wait for Pose WASM module to initialize before starting Camera
    pose.initialize().then(() => {
      if (!isMounted) return;
      setIsModelLoaded(true);

      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && isMounted) {
            await pose.send({ image: videoRef.current });
          }
        },
        width: width,
        height: height,
      });
      camera.start();
    }).catch(err => {
      console.error("Failed to initialize Mediapipe Pose", err);
    });

    function onResults(results) {
      const canvasCtx = canvasRef.current.getContext("2d");
      canvasCtx.save();

      // เคลียร์พื้นผิว
      canvasCtx.clearRect(0, 0, width, height);

      // MIRROR วิดีโอ
      canvasCtx.translate(width, 0);
      canvasCtx.scale(-1, 1);

      canvasCtx.drawImage(results.image, 0, 0, width, height);

      // FPS Calculation
      fpsRef.current++;
      const now = Date.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(fpsRef.current);
        fpsRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      const flippedLandmarks = results.poseLandmarks?.map((lm) => ({
        x: 1 - lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      }));

      // รีเซ็ต transform
      canvasCtx.setTransform(1, 0, 0, 1, 0, 0);

      // เก็บ landmarks ล่าสุด
      lastLandmarksRef.current = flippedLandmarks;

      // Auto-lock เมื่ออยู่ใน pending state และเจอคน
      if (pendingLockRef.current && flippedLandmarks && !isLocked) {
        const success = lockPerson(flippedLandmarks);
        if (success) {
          pendingLockRef.current = false;
          setTrackingStatus("locked");
        }
      }

      // ตรวจสอบ person tracking สำหรับ assisted mode
      let shouldDrawPose = true;
      let trackingResult = null;

      if (mode === "assisted" && isLocked && flippedLandmarks) {
        trackingResult = checkTargetPerson(flippedLandmarks);
        // ถ้าไม่ใช่คนที่ lock ไว้ จะแสดงผลเบาลง
        if (!trackingResult.isTarget) {
          shouldDrawPose = false;
        }
      }

      // 🟢 วาดเส้นแบ่งกึ่งกลาง (แนวตั้ง)
      canvasCtx.beginPath();
      canvasCtx.moveTo(width / 2, 0);
      canvasCtx.lineTo(width / 2, height);
      canvasCtx.strokeStyle = "rgba(0, 255, 0, 0.6)";
      canvasCtx.lineWidth = 3;
      canvasCtx.stroke();

      if (flippedLandmarks && shouldDrawPose) {
        // วาดโครงร่าง
        const isBodyConnection = ([start, end]) => start >= 11 && end >= 11;
        const bodyConnections = POSE_CONNECTIONS.filter(isBodyConnection);

        // สีต่างกันตามสถานะ tracking
        let connectorColor = "aqua";
        let landmarkColor = "red";

        if (mode === "assisted" && isLocked) {
          if (trackingResult?.confidence > 0.7) {
            connectorColor = "#00FF00"; // สีเขียว - track ได้แม่น
          } else if (trackingResult?.confidence > 0.3) {
            connectorColor = "#FFFF00"; // สีเหลือง - กำลังติดตาม
          } else {
            connectorColor = "#FF6600"; // สีส้ม - ไม่แน่ใจ
          }
        }

        drawConnectors(canvasCtx, flippedLandmarks, bodyConnections, {
          color: connectorColor,
          lineWidth: 4,
        });

        const bodyLandmarks = flippedLandmarks.slice(11);
        drawLandmarks(canvasCtx, bodyLandmarks, {
          color: landmarkColor,
          lineWidth: 2,
        });

        // วาด bounding box สำหรับ assisted mode
        if (mode === "assisted" && isLocked) {
          const bbox = getLockedBoundingBox(flippedLandmarks, width, height);
          if (bbox) {
            canvasCtx.strokeStyle = trackingResult?.isTarget
              ? "#00FF00"
              : "#FF0000";
            canvasCtx.lineWidth = 3;
            canvasCtx.setLineDash([10, 5]);
            canvasCtx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
            canvasCtx.setLineDash([]);

            // วาด label
            canvasCtx.font = "bold 16px Arial";
            canvasCtx.fillStyle = trackingResult?.isTarget
              ? "#00FF00"
              : "#FF0000";
            const label = trackingResult?.isTarget
              ? "🔒 ติดตามอยู่"
              : "⚠️ หาไม่เจอ";
            canvasCtx.fillText(label, bbox.x, bbox.y - 10);
          }
        }

        // คำนวณมุมไหล่ขวา
        const rightHip = flippedLandmarks[24];
        const rightShoulder = flippedLandmarks[12];
        const rightElbow = flippedLandmarks[14];

        const rightShoulderAngle = calculateAngle(
          rightHip,
          rightShoulder,
          rightElbow
        );

        setCurrentAngle(rightShoulderAngle);

        if (rightShoulderAngle !== null) {
          canvasCtx.font = "20px Arial";
          canvasCtx.fillStyle = "yellow";
          canvasCtx.fillText(
            `${rightShoulderAngle.toFixed(1)}°`,
            rightShoulder.x * width,
            rightShoulder.y * height - 10
          );
        }

        // คำนวณมุมไหล่ซ้าย
        const leftHip = flippedLandmarks[23];
        const leftShoulder = flippedLandmarks[11];
        const leftElbow = flippedLandmarks[13];

        const leftShoulderAngle = calculateAngle(
          leftHip,
          leftShoulder,
          leftElbow
        );

        if (leftShoulderAngle !== null) {
          canvasCtx.font = "20px Arial";
          canvasCtx.fillStyle = "yellow";
          canvasCtx.fillText(
            `${leftShoulderAngle.toFixed(1)}°`,
            leftShoulder.x * width,
            leftShoulder.y * height - 10
          );
        }
      }

      // วาด overlay เมื่อหาคนไม่เจอ
      if (mode === "assisted" && isLocked && !shouldDrawPose) {
        canvasCtx.fillStyle = "rgba(255, 0, 0, 0.2)";
        canvasCtx.fillRect(0, 0, width, height);

        canvasCtx.font = "bold 24px Arial";
        canvasCtx.fillStyle = "red";
        canvasCtx.textAlign = "center";
        canvasCtx.fillText(
          "⚠️ หาผู้ใช้ที่เลือกไว้ไม่เจอ",
          width / 2,
          height / 2
        );
        canvasCtx.textAlign = "start";
      }

      canvasCtx.restore();

      // นับจำนวนครั้งที่ยกแขน (เฉพาะเมื่อ lock แล้ว)
      if (!flippedLandmarks) return;
      if (mode === "assisted" && isLocked && !trackingResult?.isTarget) return;

      // ใช้มุมไหล่ขวาหรือซ้ายที่สูงกว่า
      const rightHip = flippedLandmarks[24];
      const rightShoulder = flippedLandmarks[12];
      const rightElbow = flippedLandmarks[14];
      const leftHip = flippedLandmarks[23];
      const leftShoulder = flippedLandmarks[11];
      const leftElbow = flippedLandmarks[13];

      const rightAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
      const leftAngle = calculateAngle(leftHip, leftShoulder, leftElbow);

      // New: Calculate Forearm Angles (Absolute angle relative to horizontal)
      // 90 = Up (Vertical), 0 = Right, 180 = Left, -90 = Down
      // Formula: Math.atan2(Elbow.y - Wrist.y, Wrist.x - Elbow.x) * 180 / PI
      // Note: Y is inverted in MediaPipe (0 is top), so (Elbow.y - Wrist.y) gives positive for Up.

      const calculateForearmAngle = (elbow, wrist) => {
        if (!elbow || !wrist) return 0;
        return Math.atan2(elbow.y - wrist.y, wrist.x - elbow.x) * 180 / Math.PI;
      };

      const rightForearmAngle = calculateForearmAngle(rightElbow, flippedLandmarks[16]); // 16 = Right Wrist
      const leftForearmAngle = calculateForearmAngle(leftElbow, flippedLandmarks[15]);  // 15 = Left Wrist

      // ใช้มุมที่สูงกว่า (แขนข้างใดข้างหนึ่งก็ได้) หรือตามที่กำหนดใน trackedSide
      let maxAngle = 0;

      if (trackingModeRef.current === "elbow") {
        // Elbow Rotation / External Rotation Logic
        const calcScore = (rawForearm) => {
          let val = (rawForearm || 0) + 90;
          if (val < 0) val = 0;
          if (val > 180) val = 180;
          return 180 - val;
        };

        const isRightShoulderValid = rightAngle >= 70 && rightAngle <= 120;
        const isLeftShoulderValid = leftAngle >= 70 && leftAngle <= 120;

        const rightScore = isRightShoulderValid ? calcScore(rightForearmAngle) : 0;
        const leftScore = isLeftShoulderValid ? calcScore(leftForearmAngle) : 0;

        if (trackedSideRef.current === "left") {
          maxAngle = leftScore;
        } else if (trackedSideRef.current === "right") {
          maxAngle = rightScore;
        } else {
          maxAngle = Math.max(rightScore, leftScore);
        }

      } else {
        // Default: Shoulder (Flexion/Abduction)
        const rAngle = rightAngle || 0;
        const lAngle = leftAngle || 0;

        if (trackedSideRef.current === "left") {
          maxAngle = lAngle;
        } else if (trackedSideRef.current === "right") {
          maxAngle = rAngle;
        } else {
          maxAngle = Math.max(rAngle, lAngle);
        }
      }

      // Send angles to parent
      currentRealtimeAngleRef.current = maxAngle;

      if (onAngleUpdateRef.current) {
        onAngleUpdateRef.current({
          right: rightAngle || 0,
          left: leftAngle || 0,
          rightForearm: rightForearmAngle || 0,
          leftForearm: leftForearmAngle || 0,
          max: maxAngle
        });
      }

      // นับเมื่อ: enableCounting=true และ กำลัง lock อยู่ และ มุม >= 165 องศา และ ก่อนหน้านี้แขนลงอยู่
      const isLockActive = isLocked || pendingLockRef.current;

      // Update Max Angle of Session
      if (isLockActive) {
        maxSessionAngleRef.current = Math.max(
          maxSessionAngleRef.current,
          maxAngle
        );
      }

      // Keep tracking the highest angle reached during the current rep
      if (!armWasDownRef.current && maxAngle > currentRepMaxAngleRef.current) {
          currentRepMaxAngleRef.current = maxAngle;
      }

      // Check if threshold is met during the upward motion
      if (
        enableCountingRef.current &&
        isLockActive &&
        maxAngle >= angleThresholdRef.current &&
        armWasDownRef.current
      ) {
        armWasDownRef.current = false; // Mark that the arm is now "up" and needs to go down to count
        currentRepMaxAngleRef.current = maxAngle; // start tracking rep max
      }

      // ให้นับเมื่อแขนลงต่ำกว่า 30 องศา และก่อนหน้านี้ได้ยกผ่านเป้าหมายมาแล้ว
      const resetThreshold = 30;

      if (enableCountingRef.current && maxAngle < resetThreshold) {
        // ถ้าแขนเคยยกผ่านเป้าหมาย (armWasDown = false) แล้วเพิ่งเอาลงมาต่ำกว่า 30
        if (!armWasDownRef.current) {
            
            // เพิ่มจำนวนครั้งตรงนี้แทน
            setArmRaiseCount((prev) => prev + 1);

            // Add the completed rep angle to the sum
            if (currentRepMaxAngleRef.current > 0) {
                sumRepAnglesRef.current += currentRepMaxAngleRef.current;
                completedRepsForAvgRef.current++;
                currentRepMaxAngleRef.current = 0;
            }
        }
        
        // เซ็ตให้รู้ว่าตอนนี้แขนลงแล้ว พร้อมสำหรับการยกครั้งต่อไป
        armWasDownRef.current = true;
      }
    }

    return () => {
      isMounted = false;
      if (camera) {
        camera.stop();
      }
      pose.close();

      // Clear window.Module to fix WASM 'Aborted' error on rapid remounts
      window.Module = undefined;
    };
  }, [mode, isLocked, checkTargetPerson, getLockedBoundingBox, lockPerson]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#F3FBFC",
        position: "relative",
      }}
    >
      {/* Loading Overlay */}
      {!isModelLoaded && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid white",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "16px",
            }}
          ></div>
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
            กำลังเตรียมระบบ และเปิดกล้อง...
          </span>
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {/* Tracking Status Badge - แสดงเมื่อ lock/pending */}
      {(trackingStatus === "locked" || trackingStatus === "pending") && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 10,
            padding: "8px 16px",
            borderRadius: "20px",
            backgroundColor:
              trackingStatus === "locked"
                ? "rgba(0, 200, 83, 0.9)"
                : "rgba(33, 150, 243, 0.9)",
            color: "white",
            fontWeight: "bold",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {trackingStatus === "locked" && "🔒 ล็อคอยู่"}
          {trackingStatus === "pending" && "🔍 กำลังหาคน..."}
        </div>
      )}

      {/* Arm Raise Count Display - แสดงเมื่อ showCountOverlay, enableCounting และ lock แล้ว */}
      {showCountOverlay && enableCounting && trackingStatus === "locked" && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 10,
            padding: "12px 24px",
            borderRadius: "16px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            fontWeight: "bold",
            fontSize: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ fontSize: "14px", opacity: 0.8 }}>จำนวนครั้ง</span>
          <span style={{ fontSize: "48px", lineHeight: 1 }}>
            {armRaiseCount}
          </span>
        </div>
      )}

      <video
        ref={videoRef}
        width={width}
        height={height}
        autoPlay
        playsInline
        muted
        style={{ transform: "scaleX(-1)", display: "none" }}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      {/* Stats Display (FPS & Resolution) */}
      <div
        style={{
          position: "absolute",
          top:
            trackingStatus === "locked" || trackingStatus === "pending"
              ? "60px"
              : "16px",
          left: "16px",
          zIndex: 10,
          padding: "6px 12px",
          borderRadius: "8px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          color: "#fff",
          fontSize: "12px",
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        <div>FPS: {fps}</div>
        <div>
          RES: {width}x{height}
        </div>
      </div>
    </div>
  );
});

export default Mediapipe;
