const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const logger = require("../logger");

// Get all symptoms
// Get all symptoms
router.get("/symptom/list", async (req, res) => {
  try {
    const symptoms = await prisma.symptoms.findMany();
    return res.status(200).json(symptoms);
  } catch (error) {
    logger.error("Get symptoms error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/symptom/listBy/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing symptom ID");
      return res.status(400).json({ message: "Missing ID" });
    }
    const symptom = await prisma.symptoms.findUnique({
      where: { id: parseInt(id) },
    });
    logger.info(`Get symptom ID ${id} success`);
    return res.status(200).json(symptom);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Create a new symptom (Setup/Admin)
router.post("/symptom/create", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Symptom title is required" });
    }

    // Check for existing symptom
    const existingSymptom = await prisma.symptoms.findFirst({
      where: { title: title },
    });
    if (existingSymptom) {
      return res.status(400).json({ message: "Symptom already exists" });
    }

    const symptom = await prisma.symptoms.create({
      data: { title },
    });
    logger.info(`Created symptom: ${title}`);
    return res.status(201).json(symptom);
  } catch (error) {
    logger.error("Create symptom error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/symptom/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    if (!id || !title) {
      logger.warn("Missing symptom ID");
      return res.status(400).json({ message: "Symptom ID and title are required" });
    }
    const symptom = await prisma.symptoms.findUnique({
      where: { id: parseInt(id) },
    });
    if (!symptom) {
      logger.warn("Symptom not found");
      return res.status(404).json({ message: "Symptom not found" });
    }
    const updateSymptom = await prisma.symptoms.update({
      where: { id: parseInt(id) },
      data: {
        title: title,
        description: description,
      },
    });
    logger.info(`Update symptom ID ${id} success`);
    return res
      .status(200)
      .json({ message: "Update symptom success", data: updateSymptom });
  } catch (error) {
    logger.error("Update symptom failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/symptom/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing symptom ID");
      return res.status(400).json({ message: "Symptom ID is required" });
    }
    const deleteSymptom = await prisma.symptoms.delete({
      where: { id: parseInt(id) },
    });
    logger.info(`Delete symptom ID ${id} success`);
    return res
      .status(200)
      .json({ message: "Delete symptom success", data: deleteSymptom });
  } catch (error) {
    logger.error("Delete symptom error", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get history for a patient
router.get("/patient-symptoms/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const history = await prisma.patientSymptoms.findMany({
      where: { patientId: parseInt(patientId) },
      include: {
        symptoms: true,
        histories: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return res.json(history);
  } catch (error) {
    logger.error("Get patient history error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
