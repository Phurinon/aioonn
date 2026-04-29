const prisma = require("../config/prisma");
const logger = require("../logger");

exports.listSymptoms = async (req, res) => {
  try {
    const symptoms = await prisma.symptoms.findMany({
      where: { deletedAt: null },
    });
    return res.status(200).json(symptoms);
  } catch (error) {
    logger.error("Get symptoms error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getSymptomById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing symptom ID");
      return res.status(400).json({ message: "Missing ID" });
    }
    const symptom = await prisma.symptoms.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    });
    logger.info(`Get symptom ID ${id} success`);
    return res.status(200).json(symptom);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.createSymptom = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Symptom title is required" });
    }

    const existingSymptom = await prisma.symptoms.findFirst({
      where: { title, deletedAt: null },
    });
    if (existingSymptom) {
      return res.status(400).json({ message: "Symptom already exists" });
    }

    const symptom = await prisma.symptoms.create({ data: { title } });
    logger.info(`Created symptom: ${title}`);
    return res.status(201).json(symptom);
  } catch (error) {
    logger.error("Create symptom error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateSymptom = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    if (!id || !title) {
      logger.warn("Missing symptom ID");
      return res.status(400).json({ message: "Symptom ID and title are required" });
    }
    const symptom = await prisma.symptoms.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    });
    if (!symptom) {
      logger.warn("Symptom not found");
      return res.status(404).json({ message: "Symptom not found" });
    }
    const updateSymptom = await prisma.symptoms.update({
      where: { id: parseInt(id) },
      data: { title, description },
    });
    logger.info(`Update symptom ID ${id} success`);
    return res.status(200).json({ message: "Update symptom success", data: updateSymptom });
  } catch (error) {
    logger.error("Update symptom failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSymptom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      logger.warn("Missing symptom ID");
      return res.status(400).json({ message: "Symptom ID is required" });
    }
    const deleteSymptom = await prisma.symptoms.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });
    logger.info(`Delete symptom ID ${id} success`);
    return res.status(200).json({ message: "Delete symptom success", data: deleteSymptom });
  } catch (error) {
    logger.error("Delete symptom error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getPatientSymptomHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const history = await prisma.patientSymptoms.findMany({
      where: { patientId: parseInt(patientId) },
      include: {
        symptoms: true,
        histories: { orderBy: { createdAt: "desc" } },
      },
    });

    return res.json(history);
  } catch (error) {
    logger.error("Get patient history error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
