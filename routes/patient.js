const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const logger = require("../logger");
const { log } = require("winston");

// Get all patients
router.get("/patient/list", async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId: parseInt(userId) } : {};
    const patients = await prisma.patients.findMany({
      where: where,
      include: {
        therapyHistories: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        patientSymptoms: {
          include: {
            symptoms: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    logger.info(`Get all patients success`);
    return res.status(200).json(patients);
  } catch (error) {
    logger.error(`Get all patients error:`, error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get patient by ID
router.get("/patient/listBy/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing patient ID");
      return res.status(400).json({ message: "Missing ID" });
    }
    const patient = await prisma.patients.findUnique({
      where: { id: parseInt(id) },
    });
    return res.status(200).json(patient);
  } catch (error) {
    logger.error(`Get patient by ID error:`, error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Create new patient
router.post("/patient/create", async (req, res) => {
  try {
    const { firstName, lastName, userId } = req.body;

    if (!firstName || !lastName || !userId) {
      return res.status(400).json({ message: "Patient name is required" });
    }

    const existingPatient = await prisma.patients.findFirst({
      where: {
        firstName: firstName,
        lastName: lastName,
        userId: userId,
      },
    });

    if (existingPatient) {
      logger.warn(
        `Create patient failed: Name ${firstName} ${lastName} already exists`
      );
      return res.status(400).json({ message: "Patient name already exists" });
    }

    const newPatient = await prisma.patients.create({
      data: {
        firstName,
        lastName,
        userId,
      },
    });
    logger.info(`Create patient success: ${firstName} ${lastName}`);
    return res.status(201).json(newPatient);
  } catch (error) {
    logger.error("Create patient failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Record a patient's symptom level
router.post("/patient/add-symptom", async (req, res) => {
  try {
    const { patientId, symptomsId, level, armSide } = req.body;

    if (!patientId || !symptomsId || !level || !armSide) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Check if patient exists
    const patient = await prisma.patients.findFirst({
      where: { id: patientId },
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // 2. Check if symptom exists
    const symptom = await prisma.symptoms.findFirst({
      where: { id: symptomsId },
    });
    if (!symptom) return res.status(404).json({ message: "Symptom not found" });

    // 3. Upsert PatientSymptom (Create if new, Update if exists)
    const patientSymptom = await prisma.patientSymptoms.upsert({
      where: {
        patientId_symptomsId: {
          patientId: patientId,
          symptomsId: symptomsId,
        },
      },
      update: {
        level: level,
        createdAt: new Date(), // Manually update for upsert? @updatedAt handles it usually
      },
      create: {
        patientId: patientId,
        symptomsId: symptomsId,
        level: level,
        armSide: armSide,
      },
    });
    logger.info(
      `Recorded symptom for patient ${patientId}: Symptom ${symptomsId}, Level ${level}`
    );
    return res
      .status(200)
      .json({ message: "Symptom recorded successfully", data: patientSymptom });
  } catch (error) {
    logger.error("Record patient symptom error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update patient
router.put("/patient/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName } = req.body;
    if (!id || !firstName || !lastName) {
      logger.warn("Missing required fields");
      return res.status(400).json({ message: "ID and patient name are required" });
    }
    const patient = await prisma.patients.findUnique({
      where: { id: parseInt(id) },
    });
    if (!patient) {
      logger.warn("Patient not found");
      return res.status(404).json({ message: "Patient not found" });
    }
    const existingPatient = await prisma.patients.findFirst({
      where: { firstName: firstName, lastName: lastName },
    });

    if (existingPatient) {
      logger.warn(
        `Update patient ID ${id} failed: Patient name already exists`
      );
      return res.status(400).json({ message: "Patient name already exists" });
    }
    const updatePatient = await prisma.patients.update({
      where: { id: parseInt(id) },
      data: { firstName, lastName },
    });
    logger.info(`Update patient ID ${id} success`);
    return res
      .status(200)
      .json({ message: "Update patient success", data: updatePatient });
  } catch (error) {
    logger.error("Update patient failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete patient
router.delete("/patient/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing patient ID");
      return res.status(400).json({ message: "Patient ID is required" });
    }
    const patient = await prisma.patients.findUnique({
      where: { id: parseInt(id) },
    });
    if (!patient) {
      logger.warn("Patient not found");
      return res.status(404).json({ message: "Patient not found" });
    }
    const deletePatient = await prisma.patients.delete({
      where: { id: parseInt(id) },
    });
    logger.info(`Delete patient ID ${id} success`);
    return res
      .status(200)
      .json({ message: "Delete patient success", data: deletePatient });
  } catch (error) {
    logger.error("Delete patient error", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete patient symptom
router.delete("/patientSymptom/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing patientSymptom ID");
      return res.status(400).json({ message: "Missing patientSymptom ID" });
    }
    const patientSymptom = await prisma.patientSymptoms.findUnique({
      where: { id: parseInt(id) },
    });
    if (!patientSymptom) {
      logger.warn("Patient symptom not found");
      return res.status(404).json({ message: "Patient symptom not found" });
    }
    const deletePatientSymptom = await prisma.patientSymptoms.delete({
      where: { id: parseInt(id) },
    });
    logger.info(`Delete patient symptom ID ${id} success`);
    return res
      .status(200)
      .json({ message: "Delete patient symptom success", data: deletePatientSymptom });
  } catch (error) {
    logger.error("Delete patient symptom error", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get patient symptoms by Patient ID
router.get("/patient/symptoms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing patient ID");
      return res.status(400).json({ message: "Patient ID is required" });
    }
    const patient = await prisma.patients.findUnique({
      where: { id: parseInt(id) },
    });
    if (!patient) {
      logger.warn("Patient not found");
      return res.status(404).json({ message: "Patient not found" });
    }
    const patientSymptoms = await prisma.patientSymptoms.findMany({
      where: { patientId: parseInt(id) },
    });
    logger.info(`Get patient symptoms ID ${id} success`);
    return res.status(200).json(patientSymptoms);
  } catch (error) {
    logger.error("Get patient symptoms error", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
