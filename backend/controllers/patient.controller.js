const prisma = require("../config/prisma");
const logger = require("../logger");

exports.listPatients = async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId: parseInt(userId), deletedAt: null } : { deletedAt: null };
    const patients = await prisma.patients.findMany({
      where,
      include: {
        therapyHistories: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        patientSymptoms: {
          include: { symptoms: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    logger.info("Get all patients success");
    return res.status(200).json(patients);
  } catch (error) {
    logger.error("Get all patients error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing patient ID");
      return res.status(400).json({ message: "Missing ID" });
    }
    const patient = await prisma.patients.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    });
    return res.status(200).json(patient);
  } catch (error) {
    logger.error("Get patient by ID error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const { firstName, lastName, userId } = req.body;

    if (!firstName || !lastName || !userId) {
      return res.status(400).json({ message: "Patient name is required" });
    }

    const existingPatient = await prisma.patients.findFirst({
      where: { firstName, lastName, userId, deletedAt: null },
    });

    if (existingPatient) {
      logger.warn(`Create patient failed: Name ${firstName} ${lastName} already exists`);
      return res.status(400).json({ message: "Patient name already exists" });
    }

    const newPatient = await prisma.patients.create({
      data: { firstName, lastName, userId },
    });
    logger.info(`Create patient success: ${firstName} ${lastName}`);
    return res.status(201).json(newPatient);
  } catch (error) {
    logger.error("Create patient failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.addSymptom = async (req, res) => {
  try {
    const { patientId, symptomsId, armSide } = req.body;

    if (!patientId || !symptomsId || !armSide) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const patient = await prisma.patients.findFirst({
      where: { id: patientId, deletedAt: null },
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const symptom = await prisma.symptoms.findFirst({ where: { id: symptomsId } });
    if (!symptom) return res.status(404).json({ message: "Symptom not found" });

    const patientSymptom = await prisma.patientSymptoms.upsert({
      where: { patientId_symptomsId: { patientId, symptomsId } },
      update: { createdAt: new Date() },
      create: { patientId, symptomsId, armSide },
    });
    logger.info(`Recorded symptom for patient ${patientId}: Symptom ${symptomsId}, Armside ${armSide}`);
    return res.status(200).json({ message: "Symptom recorded successfully", data: patientSymptom });
  } catch (error) {
    logger.error("Record patient symptom error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, symptomsId, armSide } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    const patient = await prisma.patients.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    if (symptomsId && armSide) {
      await prisma.patientSymptoms.upsert({
        where: { patientId_symptomsId: { patientId: parseInt(id), symptomsId: parseInt(symptomsId) } },
        update: { armSide, createdAt: new Date() },
        create: { patientId: parseInt(id), symptomsId: parseInt(symptomsId), armSide },
      });
    }

    logger.info(`Update patient ID ${id} success`);
    return res.status(200).json({ message: "Update patient success", data: patient });
  } catch (error) {
    logger.error("Update patient failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing patient ID");
      return res.status(400).json({ message: "Patient ID is required" });
    }
    const patient = await prisma.patients.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    });
    if (!patient) {
      logger.warn("Patient not found");
      return res.status(404).json({ message: "Patient not found" });
    }
    const deletePatient = await prisma.patients.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });
    logger.info(`Delete patient ID ${id} success`);
    return res.status(200).json({ message: "Delete patient success", data: deletePatient });
  } catch (error) {
    logger.error("Delete patient error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deletePatientSymptom = async (req, res) => {
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
    return res.status(200).json({ message: "Delete patient symptom success", data: deletePatientSymptom });
  } catch (error) {
    logger.error("Delete patient symptom error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getPatientSymptoms = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing patient ID");
      return res.status(400).json({ message: "Patient ID is required" });
    }
    const patient = await prisma.patients.findFirst({
      where: { id: parseInt(id), deletedAt: null },
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
};

exports.bulkDeletePatients = async (req, res) => {
  try {
    const { patientIds } = req.body;
    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({ message: "Patient IDs are required" });
    }

    const deleteResult = await prisma.patients.updateMany({
      where: {
        id: { in: patientIds.map((id) => parseInt(id)) },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    logger.info(`Bulk delete patients success: ${deleteResult.count} items`);
    return res.status(200).json({
      message: `Successfully deleted ${deleteResult.count} patients`,
      count: deleteResult.count,
    });
  } catch (error) {
    logger.error("Bulk delete patients error", error);
    return res.status(500).json({ message: "Server error" });
  }
};
