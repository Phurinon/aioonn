const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const logger = require("../logger");

const { auth, adminCheck } = require("../middleware/auth");

// Get all users (Admin only)
router.get("/user/list", auth, adminCheck, async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    return res.status(200).json(users);
  } catch (error) {
    logger.error("Get all users error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/listBy/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn(`Get user failed: Missing user ID`);
      return res.status(404).json({ message: "User ID is required" });
    }
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    logger.info(`Get user ID ${id} success`);
    return res.status(200).json(user);
  } catch (error) {
    logger.error("Get user failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/user/update/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, password } = req.body;
    if (!id) {
      logger.warn("Missing user ID");
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    const updateUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: {
        displayName,
        password,
      },
    });
    logger.info(`Update user ID ${id} success`);
    return res.status(200).json(updateUser);
  } catch (error) {
    logger.error("Update user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/user/delete/:id", auth, adminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing user ID");
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    const deleteUser = await prisma.users.delete({
      where: { id: parseInt(id) },
    });
    logger.info(`Delete user ID ${id} success`);
    return res
      .status(200)
      .json({ message: "User deleted successfully", data: deleteUser });
  } catch (error) {
    logger.error("Delete user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
