import { useState, useEffect } from "react";
import { getPatientSymptoms } from "../Functions/patient";
import { getPatientById } from "../Functions/patient";

/**
 * Custom hook to fetch patient symptoms and calculate the angle threshold based on their symptom level.
 * @param {string | number} patientId - The ID of the patient.
 * @returns {number} threshold - The calculated angle threshold (default 135).
 */
const usePatientLevelThreshold = (patientId) => {
  const [threshold, setThreshold] = useState(135);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        if (!patientId) return;

        // Try getting symptoms directly first
        let patientData = await getPatientSymptoms(patientId);
        
        // If it returns an object with patientSymptoms array (from getPatientById structure)
        // or just an array (from getPatientSymptoms structure), normalize it.
        let symptoms = [];

        if (Array.isArray(patientData)) {
            symptoms = patientData;
        } else if (patientData && Array.isArray(patientData.patientSymptoms)) {
            symptoms = patientData.patientSymptoms;
        } else {
            // Fallback: try fetching by ID if the specialized endpoint fails or returns unexpected structure
            const fullData = await getPatientById(patientId);
            if (fullData && Array.isArray(fullData.patientSymptoms)) {
                symptoms = fullData.patientSymptoms;
            }
        }

        if (symptoms.length > 0) {
          // Find max level from symptoms
          const levels = symptoms.map((s) => s.level);
          const maxLevel = Math.max(...levels);

          let newThreshold = 135;
          // Logic based on level
          if (maxLevel <= 2) newThreshold = 140; // Easier for low level? Or Harder? (Based on previous logic: 1-2 was 140)
          else if (maxLevel === 3) newThreshold = 120;
          else if (maxLevel === 4) newThreshold = 90;
          else if (maxLevel >= 5) newThreshold = 60; // Harder symptom = easier angle? (Level 5 = 60)

          console.log(`[Hook] Setting threshold to ${newThreshold} for patient level ${maxLevel}`);
          setThreshold(newThreshold);
        }
      } catch (err) {
        console.error("Failed to fetch patient data in hook", err);
      }
    };

    fetchPatientData();
  }, [patientId]);

  return threshold;
};

export default usePatientLevelThreshold;
