import { useState, useEffect } from "react";
import { getTherapyHistoryByPatientId } from "../Functions/therapy";
import usePatientLevelThreshold from "./usePatientLevelThreshold";

/**
 * Custom hook to fetch patient's ROM history and calculate the angle threshold based on their max achieved angle in DailyRomTesting.
 * @param {string | number} patientId - The ID of the patient.
 * @param {string} action - The action type (e.g., 'Abduction', 'Flexion', 'ExternalRotation')
 * @returns {number} threshold - The calculated max angle threshold.
 */
const usePatientRomThreshold = (patientId, action) => {
  const fallbackThreshold = usePatientLevelThreshold(patientId);
  const [thresholds, setThresholds] = useState({ left: fallbackThreshold, right: fallbackThreshold });

  useEffect(() => {
    const fetchRomData = async () => {
      try {
        if (!patientId) return;

        const response = await getTherapyHistoryByPatientId(patientId);

        if (response?.data?.data && Array.isArray(response.data.data)) {
          const history = response.data.data;

          let targetTypeIds = [];
          if (action === 'Abduction') {
            targetTypeIds = { left: 18, right: 17 }; // DailyROM Abduction Left/Right
          } else if (action === 'Flexion') {
            targetTypeIds = { left: 16, right: 15 }; // DailyROM Flexion Left/Right
          } else if (action === 'ExternalRotation') {
            targetTypeIds = { left: 20, right: 19 }; // DailyROM External Rotation Left/Right
          }

          if (targetTypeIds.left && targetTypeIds.right) {
            const leftHistory = history.filter(item => item.therapyTypesId === targetTypeIds.left);
            const rightHistory = history.filter(item => item.therapyTypesId === targetTypeIds.right);

            const leftMax = leftHistory.length > 0 ? Math.max(...leftHistory.map(h => h.angle || 0)) : 0;
            const rightMax = rightHistory.length > 0 ? Math.max(...rightHistory.map(h => h.angle || 0)) : 0;

            if (leftMax > 0 || rightMax > 0) {
              setThresholds({
                left: leftMax > 0 ? leftMax : fallbackThreshold,
                right: rightMax > 0 ? rightMax : fallbackThreshold
              });
              console.log(`[Hook] Set ${action} thresholds - Left: ${leftMax}, Right: ${rightMax} for patient ${patientId}`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch ROM data in hook", err);
      }
    };

    fetchRomData();
  }, [patientId, action, fallbackThreshold]);

  return thresholds;
};

export default usePatientRomThreshold;
