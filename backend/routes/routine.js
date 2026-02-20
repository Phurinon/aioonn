const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const logger = require("../logger");

// Create a new routine with steps
router.post("/routines", async (req, res) => {
    try {
        const { userId, title, description, steps } = req.body;

        if (!userId || !title || !steps || !Array.isArray(steps)) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newRoutine = await prisma.routine.create({
            data: {
                userId: parseInt(userId),
                title,
                description: description || "",
                steps: {
                    create: steps.map((step, index) => ({
                        therapyTypeId: parseInt(step.therapyTypeId),
                        order: index,
                        targetCount: step.targetCount ? parseInt(step.targetCount) : null,
                        targetTime: step.targetTime ? parseInt(step.targetTime) : null,
                        weight: step.weight ? parseFloat(step.weight) : null,
                    })),
                },
            },
            include: {
                steps: true,
            },
        });

        logger.info(`Routine created: ${title} (ID: ${newRoutine.id})`);
        return res.status(201).json(newRoutine);
    } catch (error) {
        logger.error("Create routine failed:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

// List all routines for a user
router.get("/routines/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const routines = await prisma.routine.findMany({
            where: {
                userId: parseInt(userId),
                deletedAt: null
            },
            include: {
                steps: {
                    include: {
                        therapyType: true
                    },
                    orderBy: {
                        order: 'asc'
                    }
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(routines);
    } catch (error) {
        logger.error("Get routines failed:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

// Get detailed routine by ID
router.get("/routines/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const routine = await prisma.routine.findUnique({
            where: { id: parseInt(id) },
            include: {
                steps: {
                    include: {
                        therapyType: true
                    },
                    orderBy: {
                        order: 'asc'
                    }
                },
            },
        });

        if (!routine || routine.deletedAt) {
            return res.status(404).json({ message: "Routine not found" });
        }

        return res.status(200).json(routine);
    } catch (error) {
        logger.error("Get routine detail failed:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

// Delete a routine (Soft delete)
router.delete("/routines/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // We can do a soft delete or hard delete. Given the schema has deletedAt, let's do soft delete.
        const deletedRoutine = await prisma.routine.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        logger.info(`Routine deleted: ID ${id}`);
        return res.status(200).json({ message: "Routine deleted successfully", data: deletedRoutine });
    } catch (error) {
        logger.error("Delete routine failed:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
