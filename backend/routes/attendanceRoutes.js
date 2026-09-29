const express = require("express");

const {
    createAttendance,
    getAttendance,
    getAttendanceById,
    updateAttendance,
    deleteAttendance,
    getAttendanceSummary,
    getAttendancePercentage,
    yoloDetectAttendance,
    yoloMarkAttendance
} = require("../controllers/attendanceController");


const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// ==========================================
// CREATE ATTENDANCE
// Admin and Faculty
// ==========================================

router.post(
    "/",
    protect,
    authorize("admin", "faculty"),
    createAttendance
);


// ==========================================
// GET ALL / FILTER / PAGINATION
// Admin and Faculty
// ==========================================

router.get(
    "/",
    protect,
    authorize("admin", "faculty"),
    getAttendance
);
// ==========================================
// ATTENDANCE SUMMARY
// ==========================================

router.get(
    "/summary",
    protect,
    authorize("admin", "faculty"),
    getAttendanceSummary
);


// ==========================================
// ATTENDANCE PERCENTAGE
// ==========================================

router.get(
    "/percentage",
    protect,
    authorize("admin", "faculty"),
    getAttendancePercentage
);

// ==========================================
// YOLO FACE DETECTION - DETECT FACES
// ==========================================

router.post(
    "/yolo-detect",
    protect,
    authorize("admin", "faculty"),
    upload.single("classImage"),
    yoloDetectAttendance
);

// ==========================================
// YOLO FACE DETECTION - MARK ATTENDANCE
// ==========================================

router.post(
    "/yolo-mark",
    protect,
    authorize("admin", "faculty"),
    yoloMarkAttendance
);

// ==========================================
// GET ATTENDANCE BY ID
// Admin and Faculty
// ==========================================

router.get(
    "/:id",
    protect,
    authorize("admin", "faculty"),
    getAttendanceById
);


// ==========================================
// UPDATE ATTENDANCE
// Admin and Faculty
// ==========================================

router.put(
    "/:id",
    protect,
    authorize("admin", "faculty"),
    updateAttendance
);


// ==========================================
// DELETE ATTENDANCE
// Admin only
// ==========================================

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteAttendance
);


module.exports = router;
