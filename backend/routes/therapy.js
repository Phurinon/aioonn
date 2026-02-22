const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const logger = require("../logger");

// Get all therapy types
router.get("/therapy/list", async (req, res) => {
  try {
    const therapyTypes = await prisma.therapyTypes.findMany({
      where: { deletedAt: null }
    });
    return res.status(200).json(therapyTypes);
  } catch (error) {
    logger.error("Get therapy types failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/therapy/listBy/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing therapy ID");
      return res.status(400).json({ message: "Therapy ID is required" });
    }
    const therapyType = await prisma.therapyTypes.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    });
    if (!therapyType) {
      logger.warn("Therapy type not found");
      return res.status(404).json({ message: "Therapy type not found" });
    }
    logger.info(`Get therapy type ID ${id} success`);
    return res
      .status(200)
      .json({ message: "Get therapy type success", data: therapyType });
  } catch (error) {
    logger.error("Get therapyType error", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/therapy/add-type", async (req, res) => {
  try {
    const { title, description, slug, category } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Therapy type title is required" });
    }

    const existingTherapy = await prisma.therapyTypes.findFirst({
      where: { title: title, deletedAt: null },
    });

    if (existingTherapy) {
      logger.warn(
        `Create therapy type failed: Title ${title} already exists`
      );
      return res
        .status(400)
        .json({ message: "Therapy type title already exists" });
    }

    const newTherapy = await prisma.therapyTypes.create({
      data: {
        title,
        description: description || "",
        slug,
        category,
      },
    });

    return res
      .status(200)
      .json({ message: "Therapy type created successfully", data: newTherapy });
  } catch (error) {
    logger.error("Create therapy type failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/therapy/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, slug, category } = req.body;
    const updatedTherapy = await prisma.therapyTypes.update({
      where: { id: parseInt(id) },
      data: { title, description, slug, category },
    });
    return res
      .status(200)
      .json({ message: "Therapy type updated successfully", data: updatedTherapy });
  } catch (error) {
    logger.error("Update therapy type failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/therapy/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTherapy = await prisma.therapyTypes.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() }
    });
    return res
      .status(200)
      .json({ message: "Therapy type deleted successfully", data: deletedTherapy });
  } catch (error) {
    logger.error("Delete therapy type failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/therapy/history/create", async (req, res) => {
  try {
    const { userId, therapyTypesId, patientId, time, score, weight, angle } =
      req.body;

    if (userId == null || therapyTypesId == null || patientId == null) {
      logger.warn("Missing required therapy history fields");
      return res.status(400).json({ message: "Required fields are missing" });
    }

    console.log(req.body);
    const patient = await prisma.patients.findUnique({
      where: { id: parseInt(patientId) },
    });
    if (!patient) {
      logger.warn("Patient not found");
      return res.status(404).json({ message: "Patient not found" });
    }
    const newHistory = await prisma.therapyHistorys.create({
      data: {
        userId,
        therapyTypesId,
        patientId,
        time: Math.round(time),
        score,
        weight,
        angle,
      },
    });
    logger.info(`TherapyHistory has saved`);
    return res
      .status(200)
      .json({ message: "Therapy history saved successfully", data: newHistory });
  } catch (error) {
    console.error(error.response?.data);
    logger.error("Save therapy history error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/therapy/history/list", async (req, res) => {
  try {
    const history = await prisma.therapyHistorys.findMany({
      where: { deletedAt: null }
    });
    logger.info("Get all therapy history success");
    return res
      .status(200)
      .json({ message: "Get all therapy history success", data: history });
  } catch (error) {
    logger.error("Get all therapy history error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/therapy/history/listBy/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.therapyHistorys.findMany({
      where: {
        patientId: parseInt(id),
        deletedAt: null
      },
    });
    logger.info(`Get therapy history user id ${id} success`);
    return res.status(200).json({
      message: `Get therapy history user id ${id} success`,
      data: history,
    });
  } catch (error) {
    logger.error(`Get therapy history user id ${id} error`, error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/therapy/history/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.therapyHistorys.findMany({
      where: {
        userId: parseInt(id),
        deletedAt: null
      },
      include: {
        patients: true,
        therapyTypes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    logger.info(`Get therapy history for user id ${id} success`);
    return res.status(200).json({
      message: `Get therapy history for user id ${id} success`,
      data: history,
    });
  } catch (error) {
    logger.error(`Get therapy history for user id ${id} error`, error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/therapy/history/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedHistory = await prisma.therapyHistorys.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() }
    });
    return res
      .status(200)
      .json({ message: "deleted success", data: deletedHistory });
  } catch (error) {
    return res.status(500).json({ message: "sever error" });
  }
});

module.exports = router;
