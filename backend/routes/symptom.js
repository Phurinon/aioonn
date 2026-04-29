const express = require("express");
const router = express.Router();
const symptomController = require("../controllers/symptom.controller");

router.get("/symptom/list", symptomController.listSymptoms);
router.get("/symptom/listBy/:id", symptomController.getSymptomById);
router.post("/symptom/create", symptomController.createSymptom);
router.put("/symptom/update/:id", symptomController.updateSymptom);
router.delete("/symptom/delete/:id", symptomController.deleteSymptom);
router.get("/patient-symptoms/:patientId", symptomController.getPatientSymptomHistory);

module.exports = router;
