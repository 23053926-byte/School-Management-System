const express = require("express");

const router = express.Router();

const {
    getStudentResult,
    getStudentResultSummary,
    getSemesterResult,
    getStudentCGPA,
    generateResultPDFController,
    sendResultEmailController
} = require("../controllers/resultController");


const authMiddleware = require("../middleware/authMiddleware");


// ======================================================
// SUBJECT-WISE RESULT
// ======================================================

router.get(
    "/student/:studentId",
    authMiddleware,
    getStudentResult
);


// ======================================================
// OVERALL RESULT + SGPA
// ======================================================

router.get(
    "/student/:studentId/summary",
    authMiddleware,
    getStudentResultSummary
);


// ======================================================
// SEMESTER-WISE RESULT
// ======================================================

router.get(
    "/student/:studentId/semester/:semester",
    authMiddleware,
    getSemesterResult
);


// ======================================================
// ALL SEMESTERS + CGPA
// ======================================================

router.get(
    "/student/:studentId/cgpa",
    authMiddleware,
    getStudentCGPA
);

// ======================================================
// GENERATE RESULT PDF
// ======================================================

router.get(
    "/student/:studentId/pdf",
    authMiddleware,
    generateResultPDFController
);
// ======================================================
// SEND RESULT PDF BY EMAIL
// ======================================================

router.post(
    "/student/:studentId/email",
    authMiddleware,
    sendResultEmailController
);

module.exports = router;
