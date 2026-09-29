const express = require("express");

const {
  createStudent,
  bulkCreateStudents,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  uploadProfilePicture
} = require("../controllers/studentController");

const upload = require("../middleware/uploadMiddleware");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();



// ==========================================
// CREATE
// Admin only
// ==========================================

router.post(
  "/",
  protect,
  authorize("admin"),
  createStudent
);

// ==========================================
// BULK IMPORT (Excel / CSV parsed client-side)
// Admin only
// ==========================================

router.post(
  "/bulk",
  protect,
  authorize("admin"),
  bulkCreateStudents
);
// ==========================================
// UPLOAD PROFILE PICTURE
// Admin only
// ==========================================

router.post(
  "/:id/profile-picture",
  protect,
  authorize("admin"),
  upload.single("profilePicture"),
  uploadProfilePicture
);

// ==========================================
// GET ALL
// Admin + Faculty
// ==========================================

router.get(
  "/",
  protect,
  authorize("admin", "faculty"),
  getStudents
);


// ==========================================
// GET SINGLE STUDENT
// Admin + Faculty
// ==========================================

router.get(
  "/:id",
  protect,
  authorize("admin", "faculty"),
  getStudentById
);


// ==========================================
// UPDATE
// Admin only
// ==========================================

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateStudent
);


// ==========================================
// DELETE
// Admin only
// ==========================================

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteStudent
);


module.exports = router;
