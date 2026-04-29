const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patient.controller");

router.get("/patient/list", patientController.listPatients);
router.get("/patient/listBy/:id", patientController.getPatientById);
router.post("/patient/create", patientController.createPatient);
router.post("/patient/add-symptom", patientController.addSymptom);
router.put("/patient/update/:id", patientController.updatePatient);
router.delete("/patient/delete/:id", patientController.deletePatient);
router.delete("/patientSymptom/delete/:id", patientController.deletePatientSymptom);
router.get("/patient/symptoms/:id", patientController.getPatientSymptoms);
router.post("/patient/bulk-delete", patientController.bulkDeletePatients);

module.exports = router;
