const express = require("express");

const {
    createFaculty,
    getFaculties,
    getFacultyById,
    updateFaculty,
    deleteFaculty,
    uploadFacultyProfilePicture
} = require("../controllers/facultyController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Create faculty
router.post(
    "/",
    protect,
    authorize("admin"),
    createFaculty
);

// Get all faculties
router.get(
    "/",
    protect,
    authorize("admin", "faculty"),
    getFaculties
);

// Get faculty by ID
router.get(
    "/:id",
    protect,
    authorize("admin", "faculty"),
    getFacultyById
);

// Update faculty
router.put(
    "/:id",
    protect,
    authorize("admin"),
    updateFaculty
);

// Delete faculty
router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteFaculty
);
// Upload faculty profile picture
router.post(
    "/:id/profile-picture",
    protect,
    authorize("admin"),
    upload.single("profilePicture"),
    uploadFacultyProfilePicture
);

module.exports = router;
