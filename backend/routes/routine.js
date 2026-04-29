const express = require("express");
const router = express.Router();
const routineController = require("../controllers/routine.controller");

router.post("/routines/create", routineController.createRoutine);
router.get("/routines/user/:userId", routineController.listRoutinesByUser);
router.get("/routines/:id", routineController.getRoutineById);
router.put("/routines/update/:id", routineController.updateRoutine);
router.delete("/routines/delete/:id", routineController.deleteRoutine);

module.exports = router;
