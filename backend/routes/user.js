const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { auth, adminCheck } = require("../middleware/auth");

router.get("/user/verify-admin", auth, adminCheck, userController.verifyAdmin);
router.get("/user/list", auth, adminCheck, userController.listUsers);
router.get("/user/listBy/:id", auth, userController.getUserById);
router.put("/user/update/:id", auth, userController.updateUser);
router.delete("/user/delete/:id", auth, adminCheck, userController.deleteUser);

module.exports = router;
