const Marks = require("../models/Marks");
const Student = require("../models/Student");
const {
    generateResultPDF,
    generateResultPDFBuffer
} = require("../services/resultPdfService");
const {
    sendResultEmail
} = require("../services/emailService");


// ======================================================
// GET SUBJECT-WISE RESULT FOR A STUDENT
// ======================================================

const getStudentResult = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate MongoDB ID
        if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        // Check student exists
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get all marks of student
        const marks = await Marks.find({
            student: studentId
        })
            .populate("subject")
            .populate("faculty");

        if (marks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No marks found for this student"
            });
        }

        // Prepare result
        const results = marks.map((mark) => ({
            subjectId: mark.subject.subjectId,
            subjectCode: mark.subject.subjectCode,
            subjectName: mark.subject.subjectName,
            credits: mark.subject.credits,

            internalMarks: mark.internalMarks,
            externalMarks: mark.externalMarks,
            totalMarks: mark.totalMarks,

            grade: mark.grade,
            gradePoint: mark.gradePoint,
            result: mark.result,

            faculty: mark.faculty
                ? mark.faculty.name
                : null,

            remarks: mark.remarks
        }));

        res.status(200).json({
            success: true,

            student: {
                id: student._id,
                studentId: student.studentId,
                name: student.name,
                department: student.department,
                course: student.course,
                semester: student.semester
            },

            count: results.length,
            data: results
        });

    } catch (error) {
        console.error("Get Student Result Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


// ======================================================
// GET OVERALL RESULT + SGPA
// ======================================================

const getStudentResultSummary = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester } = req.query;

        // Validate MongoDB ID
        if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        // Check student
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Build query
        let query = { student: studentId };
        if (semester) {
            // Need to populate subject first to filter by semester
            const marksWithSubject = await Marks.find({ student: studentId })
                .populate("subject");

            const filteredMarks = marksWithSubject.filter(mark =>
                String(mark.subject.semester) === String(semester)
            );

            if (filteredMarks.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `No marks found for semester ${semester}`
                });
            }

            // Use filtered marks for calculation
            const marks = filteredMarks;

            let totalMarks = 0;
            let totalMaximumMarks = 0;

            let totalCredits = 0;
            let weightedGradePoints = 0;

            let passedSubjects = 0;
            let failedSubjects = 0;

            const subjects = [];

            marks.forEach((mark) => {
                // Get subject info from populated data
                const subject = mark.subject;
                const credits = Number(subject.credits) || 0;

                totalMarks += Number(mark.totalMarks) || 0;

                // Every subject has 100 maximum marks
                totalMaximumMarks += 100;

                totalCredits += credits;

                weightedGradePoints +=
                    Number(mark.gradePoint) * credits;

                if (mark.result === "Pass") {
                    passedSubjects++;
                } else {
                    failedSubjects++;
                }

                subjects.push({
                    subjectCode: subject.subjectCode,
                    subjectName: subject.subjectName,
                    credits: credits,

                    internalMarks: mark.internalMarks,
                    externalMarks: mark.externalMarks,
                    totalMarks: mark.totalMarks,

                    grade: mark.grade,
                    gradePoint: mark.gradePoint,
                    result: mark.result
                });
            });

            // Percentage
            const percentage =
                (totalMarks / totalMaximumMarks) * 100;

            // SGPA
            const sgpa =
                totalCredits > 0
                    ? weightedGradePoints / totalCredits
                    : 0;

            // Overall result
            const overallResult =
                failedSubjects === 0
                    ? "Pass"
                    : "Fail";

            res.status(200).json({
                success: true,

                student: {
                    id: student._id,
                    studentId: student.studentId,
                    name: student.name,
                    department: student.department,
                    course: student.course,
                    semester: student.semester
                },

                summary: {
                    subjects: marks.length,

                    totalMarks,
                    totalMaximumMarks,

                    percentage: Number(percentage.toFixed(2)),

                    totalCredits,

                    sgpa: Number(sgpa.toFixed(2)),

                    passedSubjects,
                    failedSubjects,

                    overallResult
                },

                subjects

            });
            return;
        }

        // Get marks (no semester filter)
        const marks = await Marks.find({
            student: studentId
        }).populate("subject");

        if (marks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No marks found for this student"
            });
        }

        let totalMarks = 0;
        let totalMaximumMarks = 0;

        let totalCredits = 0;
        let weightedGradePoints = 0;

        let passedSubjects = 0;
        let failedSubjects = 0;

        const subjects = [];

        marks.forEach((mark) => {
            const credits = Number(mark.subject.credits) || 0;

            totalMarks += Number(mark.totalMarks) || 0;

            // Every subject has 100 maximum marks
            totalMaximumMarks += 100;

            totalCredits += credits;

            weightedGradePoints +=
                Number(mark.gradePoint) * credits;

            if (mark.result === "Pass") {
                passedSubjects++;
            } else {
                failedSubjects++;
            }

            subjects.push({
                subjectCode: mark.subject.subjectCode,
                subjectName: mark.subject.subjectName,
                credits: credits,

                internalMarks: mark.internalMarks,
                externalMarks: mark.externalMarks,
                totalMarks: mark.totalMarks,

                grade: mark.grade,
                gradePoint: mark.gradePoint,
                result: mark.result
            });
        });

        // Percentage
        const percentage =
            (totalMarks / totalMaximumMarks) * 100;

        // SGPA
        const sgpa =
            totalCredits > 0
                ? weightedGradePoints / totalCredits
                : 0;

        // Overall result
        const overallResult =
            failedSubjects === 0
                ? "Pass"
                : "Fail";

        res.status(200).json({
            success: true,

            student: {
                id: student._id,
                studentId: student.studentId,
                name: student.name,
                department: student.department,
                course: student.course,
                semester: student.semester
            },

            summary: {
                subjects: marks.length,

                totalMarks,
                totalMaximumMarks,

                percentage: Number(percentage.toFixed(2)),

                totalCredits,

                sgpa: Number(sgpa.toFixed(2)),

                passedSubjects,
                failedSubjects,

                overallResult
            },

            subjects

        });

    } catch (error) {
        console.error("Get Result Summary Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};
// ======================================================
// GET SEMESTER-WISE RESULT
// ======================================================

const getSemesterResult = async (req, res) => {
    try {
        const { studentId, semester } = req.params;

        // Validate student ID
        if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        // Validate semester
        const semesterNumber = Number(semester);

        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 8
        ) {
            return res.status(400).json({
                success: false,
                message: "Semester must be between 1 and 8"
            });
        }

        // Check student
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get marks and subject information
        const marks = await Marks.find({
            student: studentId
        }).populate("subject");

        // Only marks belonging to requested semester
        const semesterMarks = marks.filter(
            (mark) =>
                String(mark.subject.semester) === String(semester)
        );

        if (semesterMarks.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No marks found for semester ${semesterNumber}`
            });
        }

        let totalMarks = 0;
        let totalMaximumMarks = 0;
        let totalCredits = 0;
        let weightedGradePoints = 0;

        let passedSubjects = 0;
        let failedSubjects = 0;

        const subjects = [];

        semesterMarks.forEach((mark) => {
            const credits = Number(mark.subject.credits) || 0;

            totalMarks += Number(mark.totalMarks) || 0;
            totalMaximumMarks += 100;

            totalCredits += credits;

            weightedGradePoints +=
                Number(mark.gradePoint) * credits;

            if (mark.result === "Pass") {
                passedSubjects++;
            } else {
                failedSubjects++;
            }

            subjects.push({
                subjectCode: mark.subject.subjectCode,
                subjectName: mark.subject.subjectName,
                credits,

                internalMarks: mark.internalMarks,
                externalMarks: mark.externalMarks,
                totalMarks: mark.totalMarks,

                grade: mark.grade,
                gradePoint: mark.gradePoint,
                result: mark.result
            });
        });

        const percentage =
            (totalMarks / totalMaximumMarks) * 100;

        const sgpa =
            totalCredits > 0
                ? weightedGradePoints / totalCredits
                : 0;

        const overallResult =
            failedSubjects === 0
                ? "Pass"
                : "Fail";

        res.status(200).json({
            success: true,

            student: {
                id: student._id,
                studentId: student.studentId,
                name: student.name,
                department: student.department,
                course: student.course
            },

            semester: semesterNumber,

            summary: {
                subjects: semesterMarks.length,

                totalMarks,
                totalMaximumMarks,

                percentage: Number(
                    percentage.toFixed(2)
                ),

                totalCredits,

                sgpa: Number(
                    sgpa.toFixed(2)
                ),

                passedSubjects,
                failedSubjects,

                overallResult
            },

            subjects
        });

    } catch (error) {
        console.error("Get Semester Result Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


// ======================================================
// GET ALL SEMESTERS + CGPA
// ======================================================

const getStudentCGPA = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate student ID
        if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        // Check student
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get all marks
        const marks = await Marks.find({
            student: studentId
        }).populate("subject");

        if (marks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No marks found for this student"
            });
        }

        // Group marks by semester
        const semesterMap = {};

        marks.forEach((mark) => {
            const semester = Number(mark.subject.semester);

            if (!semesterMap[semester]) {
                semesterMap[semester] = [];
            }

            semesterMap[semester].push(mark);
        });

        const semesters = [];

        let totalAllCredits = 0;
        let totalWeightedGradePoints = 0;

        // Calculate every semester
        Object.keys(semesterMap)
            .sort((a, b) => Number(a) - Number(b))
            .forEach((semester) => {

                const semesterMarks = semesterMap[semester];

                let totalMarks = 0;
                let totalMaximumMarks = 0;
                let totalCredits = 0;
                let weightedGradePoints = 0;

                let passedSubjects = 0;
                let failedSubjects = 0;

                semesterMarks.forEach((mark) => {
                    const credits =
                        Number(mark.subject.credits) || 0;

                    totalMarks +=
                        Number(mark.totalMarks) || 0;

                    totalMaximumMarks += 100;

                    totalCredits += credits;

                    weightedGradePoints +=
                        Number(mark.gradePoint) * credits;

                    if (mark.result === "Pass") {
                        passedSubjects++;
                    } else {
                        failedSubjects++;
                    }
                });

                const percentage =
                    (totalMarks / totalMaximumMarks) * 100;

                const sgpa =
                    totalCredits > 0
                        ? weightedGradePoints / totalCredits
                        : 0;

                totalAllCredits += totalCredits;

                totalWeightedGradePoints +=
                    weightedGradePoints;

                semesters.push({
                    semester: Number(semester),

                    subjects: semesterMarks.length,

                    totalMarks,
                    totalMaximumMarks,

                    percentage: Number(
                        percentage.toFixed(2)
                    ),

                    totalCredits,

                    sgpa: Number(
                        sgpa.toFixed(2)
                    ),

                    passedSubjects,
                    failedSubjects,

                    result:
                        failedSubjects === 0
                            ? "Pass"
                            : "Fail"
                });
            });

        // Calculate CGPA using all credits
        const cgpa =
            totalAllCredits > 0
                ? totalWeightedGradePoints /
                  totalAllCredits
                : 0;

        // Overall result
        const totalFailedSubjects = marks.filter(
            (mark) => mark.result === "Fail"
        ).length;

        const overallResult =
            totalFailedSubjects === 0
                ? "Pass"
                : "Fail";

        res.status(200).json({
            success: true,

            student: {
                id: student._id,
                studentId: student.studentId,
                name: student.name,
                department: student.department,
                course: student.course
            },

            overall: {
                semesters: semesters.length,

                totalCredits: totalAllCredits,

                cgpa: Number(
                    cgpa.toFixed(2)
                ),

                overallResult
            },

            semesters
        });

    } catch (error) {
        console.error("Get Student CGPA Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ======================================================
// GENERATE RESULT PDF
// ======================================================

const generateResultPDFController = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate student ID
        if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        // Find student
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get all marks
        const marks = await Marks.find({
            student: studentId
        }).populate("subject");

        if (marks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No marks found for this student"
            });
        }

        // ==========================================
        // CALCULATE RESULT SUMMARY
        // ==========================================

        let totalMarks = 0;
        let totalMaximumMarks = 0;
        let totalCredits = 0;
        let weightedGradePoints = 0;

        let passedSubjects = 0;
        let failedSubjects = 0;

        marks.forEach((mark) => {
            const credits =
                Number(mark.subject.credits) || 0;

            totalMarks +=
                Number(mark.totalMarks) || 0;

            totalMaximumMarks += 100;

            totalCredits += credits;

            weightedGradePoints +=
                Number(mark.gradePoint) * credits;

            if (mark.result === "Pass") {
                passedSubjects++;
            } else {
                failedSubjects++;
            }
        });

        // Percentage
        const percentage =
            (totalMarks / totalMaximumMarks) * 100;

        // SGPA
        const sgpa =
            totalCredits > 0
                ? weightedGradePoints / totalCredits
                : 0;

        // For current implementation,
        // CGPA is based on all available marks.
        const cgpa = sgpa;

        const overallResult =
            failedSubjects === 0
                ? "Pass"
                : "Fail";

        const summary = {
            totalMarks,
            totalMaximumMarks,

            percentage: Number(
                percentage.toFixed(2)
            ),

            totalCredits,

            sgpa: Number(
                sgpa.toFixed(2)
            ),

            cgpa: Number(
                cgpa.toFixed(2)
            ),

            passedSubjects,
            failedSubjects,

            overallResult
        };

        // ==========================================
        // GENERATE PDF
        // ==========================================

        generateResultPDF(
            student,
            marks,
            summary,
            res
        );

    } catch (error) {
        console.error(
            "Generate Result PDF Error:",
            error
        );

        // Only send JSON if headers
        // haven't already been sent
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    }
};

// ======================================================
// SEND RESULT PDF BY EMAIL
// ======================================================

const sendResultEmailController = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate student ID
        if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        // Find student
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Check email
        if (!student.email) {
            return res.status(400).json({
                success: false,
                message: "Student email address not found"
            });
        }

        // Get marks
        const marks = await Marks.find({
            student: studentId
        }).populate("subject");

        if (marks.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No marks found for this student"
            });
        }

        // ==========================================
        // CALCULATE RESULT SUMMARY
        // ==========================================

        let totalMarks = 0;
        let totalMaximumMarks = 0;
        let totalCredits = 0;
        let weightedGradePoints = 0;

        let passedSubjects = 0;
        let failedSubjects = 0;

        marks.forEach((mark) => {
            const credits =
                Number(mark.subject.credits) || 0;

            totalMarks +=
                Number(mark.totalMarks) || 0;

            totalMaximumMarks += 100;

            totalCredits += credits;

            weightedGradePoints +=
                Number(mark.gradePoint) * credits;

            if (mark.result === "Pass") {
                passedSubjects++;
            } else {
                failedSubjects++;
            }
        });

        const percentage =
            (totalMarks / totalMaximumMarks) * 100;

        const sgpa =
            totalCredits > 0
                ? weightedGradePoints / totalCredits
                : 0;

        // Currently only available semester data
        const cgpa = sgpa;

        const overallResult =
            failedSubjects === 0
                ? "Pass"
                : "Fail";

        const summary = {
            totalMarks,
            totalMaximumMarks,

            percentage: Number(
                percentage.toFixed(2)
            ),

            totalCredits,

            sgpa: Number(
                sgpa.toFixed(2)
            ),

            cgpa: Number(
                cgpa.toFixed(2)
            ),

            passedSubjects,
            failedSubjects,

            overallResult
        };

        // ==========================================
        // GENERATE PDF BUFFER
        // ==========================================

        const pdfBuffer =
            await generateResultPDFBuffer(
                student,
                marks,
                summary
            );

        // ==========================================
        // SEND EMAIL
        // ==========================================

        await sendResultEmail(
            student.email,
            student.name,
            pdfBuffer
        );

        res.status(200).json({
            success: true,
            message: "Result PDF sent successfully",
            email: student.email
        });

    } catch (error) {

        console.error(
            "Send Result Email Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to send result email",
            error: error.message
        });
    }
};

module.exports = {
    getStudentResult,
    getStudentResultSummary,
    getSemesterResult,
    getStudentCGPA,
    generateResultPDFController,
    sendResultEmailController
};