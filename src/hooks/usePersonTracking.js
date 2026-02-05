import { useState, useCallback, useRef } from "react";

/**
 * Hook สำหรับ lock และติดตามคนใดคนหนึ่งในโหมด Assisted
 * ใช้ตำแหน่ง hip (สะโพก) เป็นจุดอ้างอิงหลัก เพราะเป็นจุดที่เคลื่อนที่น้อยที่สุด
 */
export default function usePersonTracking(options = {}) {
    const {
        // ระยะทาง threshold สำหรับการเปรียบเทียบตำแหน่ง (normalized 0-1)
        positionThreshold = 0.15,
        // จำนวน frame ที่หายไปก่อนถือว่าคนออกจากจอ
        lostFrameThreshold = 15,
    } = options;

    // ตำแหน่งที่ lock ไว้ (ใช้ hip position เป็นหลัก)
    const [lockedPosition, setLockedPosition] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [personLost, setPersonLost] = useState(false);

    // นับจำนวน frame ที่หาคนไม่เจอ
    const lostFrameCount = useRef(0);

    // เก็บ smoothed position เพื่อลด jitter
    const smoothedPosition = useRef(null);

    /**
     * คำนวณ center position จาก landmarks
     * ใช้ hip (23, 24) และ shoulder (11, 12) เพื่อหา center ของลำตัว
     */
    const calculateCenterPosition = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 25) return null;

        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        // ตรวจสอบ visibility
        const minVisibility = 0.5;
        if (
            leftHip.visibility < minVisibility ||
            rightHip.visibility < minVisibility ||
            leftShoulder.visibility < minVisibility ||
            rightShoulder.visibility < minVisibility
        ) {
            return null;
        }

        // คำนวณ center ของลำตัว
        const centerX = (leftHip.x + rightHip.x + leftShoulder.x + rightShoulder.x) / 4;
        const centerY = (leftHip.y + rightHip.y + leftShoulder.y + rightShoulder.y) / 4;

        // คำนวณ body width เพื่อใช้เป็น reference
        const bodyWidth = Math.abs(leftShoulder.x - rightShoulder.x);

        return { x: centerX, y: centerY, bodyWidth };
    }, []);

    /**
     * คำนวณระยะห่างระหว่าง 2 ตำแหน่ง
     */
    const calculateDistance = useCallback((pos1, pos2) => {
        if (!pos1 || !pos2) return Infinity;
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }, []);

    /**
     * Lock คนที่ตรวจจับได้ในปัจจุบัน
     */
    const lockPerson = useCallback((landmarks) => {
        const position = calculateCenterPosition(landmarks);
        if (position) {
            setLockedPosition(position);
            smoothedPosition.current = position;
            setIsLocked(true);
            setPersonLost(false);
            lostFrameCount.current = 0;
            return true;
        }
        return false;
    }, [calculateCenterPosition]);

    /**
     * ปลด lock เพื่อเปลี่ยนคน
     */
    const unlockPerson = useCallback(() => {
        setLockedPosition(null);
        smoothedPosition.current = null;
        setIsLocked(false);
        setPersonLost(false);
        lostFrameCount.current = 0;
    }, []);

    /**
     * ตรวจสอบว่า landmarks ที่ได้มาตรงกับคนที่ lock ไว้หรือไม่
     * Returns: { isTarget: boolean, confidence: number }
     */
    const checkTargetPerson = useCallback((landmarks) => {
        if (!isLocked || !lockedPosition) {
            return { isTarget: true, confidence: 1 };
        }

        const currentPosition = calculateCenterPosition(landmarks);

        if (!currentPosition) {
            // ตรวจจับไม่ได้ (อาจจะบัง หรือออกจากจอ)
            lostFrameCount.current++;

            if (lostFrameCount.current >= lostFrameThreshold) {
                setPersonLost(true);
                return { isTarget: false, confidence: 0, reason: "person_lost" };
            }

            return { isTarget: true, confidence: 0.5, reason: "temporary_lost" };
        }

        // คำนวณระยะห่างจากตำแหน่งที่ lock ไว้
        const distance = calculateDistance(currentPosition, smoothedPosition.current);

        // ใช้ body width เป็น adaptive threshold
        const adaptiveThreshold = Math.max(
            positionThreshold,
            currentPosition.bodyWidth * 1.5
        );

        if (distance < adaptiveThreshold) {
            // พบคนที่ lock ไว้
            lostFrameCount.current = 0;
            setPersonLost(false);

            // Smooth update position (exponential moving average)
            const alpha = 0.3;
            smoothedPosition.current = {
                x: smoothedPosition.current.x * (1 - alpha) + currentPosition.x * alpha,
                y: smoothedPosition.current.y * (1 - alpha) + currentPosition.y * alpha,
                bodyWidth: currentPosition.bodyWidth,
            };

            const confidence = 1 - (distance / adaptiveThreshold);
            return { isTarget: true, confidence };
        } else {
            // ตำแหน่งห่างเกินไป อาจเป็นคนอื่น
            lostFrameCount.current++;

            if (lostFrameCount.current >= lostFrameThreshold) {
                setPersonLost(true);
                return { isTarget: false, confidence: 0, reason: "wrong_person" };
            }

            return { isTarget: true, confidence: 0.3, reason: "uncertain" };
        }
    }, [isLocked, lockedPosition, calculateCenterPosition, calculateDistance, positionThreshold, lostFrameThreshold]);

    /**
     * Get bounding box ของคนที่ lock ไว้ สำหรับวาด visual indicator
     */
    const getLockedBoundingBox = useCallback((landmarks, canvasWidth, canvasHeight) => {
        if (!isLocked || !landmarks) return null;

        // หา min/max ของ body landmarks (11-24)
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (let i = 11; i <= 24; i++) {
            const lm = landmarks[i];
            if (lm && lm.visibility > 0.5) {
                minX = Math.min(minX, lm.x);
                maxX = Math.max(maxX, lm.x);
                minY = Math.min(minY, lm.y);
                maxY = Math.max(maxY, lm.y);
            }
        }

        if (minX === Infinity) return null;

        // เพิ่ม padding
        const paddingX = (maxX - minX) * 0.2;
        const paddingY = (maxY - minY) * 0.1;

        return {
            x: (minX - paddingX) * canvasWidth,
            y: (minY - paddingY) * canvasHeight,
            width: (maxX - minX + paddingX * 2) * canvasWidth,
            height: (maxY - minY + paddingY * 2) * canvasHeight,
        };
    }, [isLocked]);

    return {
        isLocked,
        personLost,
        lockedPosition,
        lockPerson,
        unlockPerson,
        checkTargetPerson,
        getLockedBoundingBox,
    };
}
