const express = require("express");

const {
    createSubject,
    getSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// CREATE SUBJECT
// Admin only
// ==========================================

router.post(
    "/",
    protect,
    authorize("admin"),
    createSubject
);


// ==========================================
// GET ALL / SEARCH / FILTER / PAGINATION
// Admin and Faculty
// ==========================================

router.get(
    "/",
    protect,
    authorize("admin", "faculty"),
    getSubjects
);


// ==========================================
// GET SUBJECT BY ID
// Admin and Faculty
// ==========================================

router.get(
    "/:id",
    protect,
    authorize("admin", "faculty"),
    getSubjectById
);


// ==========================================
// UPDATE SUBJECT
// Admin only
// ==========================================

router.put(
    "/:id",
    protect,
    authorize("admin"),
    updateSubject
);


// ==========================================
// DELETE SUBJECT
// Admin only
// ==========================================

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteSubject
);


module.exports = router;
