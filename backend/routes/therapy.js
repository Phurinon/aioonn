const express = require("express");
const router = express.Router();
const therapyController = require("../controllers/therapy.controller");

router.get("/therapy/list", therapyController.listTherapyTypes);
router.get("/therapy/listBy/:id", therapyController.getTherapyTypeById);
router.post("/therapy/add-type", therapyController.addTherapyType);
router.put("/therapy/update/:id", therapyController.updateTherapyType);
router.delete("/therapy/delete/:id", therapyController.deleteTherapyType);
router.post("/therapy/history/create", therapyController.createTherapyHistory);
router.get("/therapy/history/list", therapyController.listTherapyHistory);
router.get("/therapy/history/listBy/:id", therapyController.getTherapyHistoryByPatient);
router.get("/therapy/history/user/:id", therapyController.getTherapyHistoryByUser);
router.delete("/therapy/history/delete/:id", therapyController.deleteTherapyHistory);

module.exports = router;
