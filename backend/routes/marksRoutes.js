const express = require("express");

const router = express.Router();

const {
    createMarks,
    getAllMarks,
    getMarksById,
    updateMarks,
    deleteMarks
} = require("../controllers/marksController");

const authMiddleware = require("../middleware/authMiddleware");

// Create marks
router.post("/", authMiddleware, createMarks);

// Get all marks
router.get("/", authMiddleware, getAllMarks);

// Get marks by ID
router.get("/:id", authMiddleware, getMarksById);

// Update marks
router.put("/:id", authMiddleware, updateMarks);

// Delete marks
router.delete("/:id", authMiddleware, deleteMarks);

module.exports = router;
