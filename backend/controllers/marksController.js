const Marks = require("../models/Marks");

// Grade calculation function
const calculateGrade = (totalMarks) => {
    if (totalMarks >= 90) {
        return {
            grade: "O",
            gradePoint: 10
        };
    } else if (totalMarks >= 80) {
        return {
            grade: "A+",
            gradePoint: 9
        };
    } else if (totalMarks >= 70) {
        return {
            grade: "A",
            gradePoint: 8
        };
    } else if (totalMarks >= 60) {
        return {
            grade: "B+",
            gradePoint: 7
        };
    } else if (totalMarks >= 50) {
        return {
            grade: "B",
            gradePoint: 6
        };
    } else if (totalMarks >= 40) {
        return {
            grade: "C",
            gradePoint: 5
        };
    } else {
        return {
            grade: "F",
            gradePoint: 0
        };
    }
};


// CREATE MARKS
const createMarks = async (req, res) => {
    try {
        const {
            student,
            subject,
            faculty,
            internalMarks,
            externalMarks,
            remarks
        } = req.body;

        // Basic validation
        if (
            !student ||
            !subject ||
            !faculty ||
            internalMarks === undefined ||
            externalMarks === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Student, subject, faculty, internal marks and external marks are required"
            });
        }

        // Check marks range
        if (internalMarks < 0 || internalMarks > 40) {
            return res.status(400).json({
                success: false,
                message: "Internal marks must be between 0 and 40"
            });
        }

        if (externalMarks < 0 || externalMarks > 60) {
            return res.status(400).json({
                success: false,
                message: "External marks must be between 0 and 60"
            });
        }

        // Check duplicate
        const existingMarks = await Marks.findOne({
            organizationId: req.organizationId,
            student,
            subject
        });

        if (existingMarks) {
            return res.status(400).json({
                success: false,
                message: "Marks already exist for this student and subject"
            });
        }

        // Calculate total
        const totalMarks =
            Number(internalMarks) + Number(externalMarks);

        // Calculate grade
        const gradeData = calculateGrade(totalMarks);

        // Pass / Fail
        const result =
            totalMarks >= 40 ? "Pass" : "Fail";

        const marks = await Marks.create({
            organizationId: req.organizationId,
            student,
            subject,
            faculty,
            internalMarks,
            externalMarks,
            totalMarks,
            grade: gradeData.grade,
            gradePoint: gradeData.gradePoint,
            result,
            remarks
        });

        const populatedMarks = await Marks.findOne({ _id: marks._id, organizationId: req.organizationId })
            .populate("student", "studentId name email department course semester")
            .populate("subject", "subjectId subjectCode subjectName department course semester credits")
            .populate("faculty", "facultyId name email department designation");

        res.status(201).json({
            success: true,
            message: "Marks created successfully",
            data: populatedMarks
        });

    } catch (error) {
        console.error("Create Marks Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


// GET ALL MARKS
const getAllMarks = async (req, res) => {
    try {
        const {
            student,
            subject,
            faculty,
            result,
            page = 1,
            limit = 10
        } = req.query;

        const filter = { organizationId: req.organizationId };

        if (student) filter.student = student;
        if (subject) filter.subject = subject;
        if (faculty) filter.faculty = faculty;
        if (result) filter.result = result;

        const skip = (page - 1) * limit;

        const marks = await Marks.find(filter)
            .populate("student", "studentId name email department course semester")
            .populate("subject", "subjectId subjectCode subjectName department course semester credits")
            .populate("faculty", "facultyId name email department designation")
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Marks.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: marks.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: marks
        });

    } catch (error) {
        console.error("Get Marks Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


// GET MARKS BY ID
const getMarksById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid marks ID"
            });
        }

        const marks = await Marks.findOne({ _id: id, organizationId: req.organizationId });

        if (!marks) {
            return res.status(404).json({
                success: false,
                message: "Marks not found"
            });
        }

        res.status(200).json({
            success: true,
            data: marks
        });

    } catch (error) {
        console.error("Get Marks By ID Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


// UPDATE MARKS
const updateMarks = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid marks ID"
            });
        }

        const marks = await Marks.findOne({ _id: id, organizationId: req.organizationId });

        if (!marks) {
            return res.status(404).json({
                success: false,
                message: "Marks not found"
            });
        }

        const internalMarks =
            req.body.internalMarks !== undefined
                ? Number(req.body.internalMarks)
                : marks.internalMarks;

        const externalMarks =
            req.body.externalMarks !== undefined
                ? Number(req.body.externalMarks)
                : marks.externalMarks;

        if (internalMarks < 0 || internalMarks > 40) {
            return res.status(400).json({
                success: false,
                message: "Internal marks must be between 0 and 40"
            });
        }

        if (externalMarks < 0 || externalMarks > 60) {
            return res.status(400).json({
                success: false,
                message: "External marks must be between 0 and 60"
            });
        }

        const totalMarks = internalMarks + externalMarks;

        const gradeData = calculateGrade(totalMarks);

        const result =
            totalMarks >= 40 ? "Pass" : "Fail";

        marks.internalMarks = internalMarks;
        marks.externalMarks = externalMarks;
        marks.totalMarks = totalMarks;
        marks.grade = gradeData.grade;
        marks.gradePoint = gradeData.gradePoint;
        marks.result = result;

        if (req.body.remarks !== undefined) {
            marks.remarks = req.body.remarks;
        }

        await marks.save();

        const updatedMarks = await Marks.findById(id)
            .populate("student", "studentId name email department course semester")
            .populate("subject", "subjectId subjectCode subjectName department course semester credits")
            .populate("faculty", "facultyId name email department designation");

        res.status(200).json({
            success: true,
            message: "Marks updated successfully",
            data: updatedMarks
        });

    } catch (error) {
        console.error("Update Marks Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


// DELETE MARKS
const deleteMarks = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid marks ID"
            });
        }

        const marks = await Marks.findOne({ _id: id, organizationId: req.organizationId });

        if (!marks) {
            return res.status(404).json({
                success: false,
                message: "Marks not found"
            });
        }

        await Marks.findOneAndDelete({ _id: id, organizationId: req.organizationId });

        res.status(200).json({
            success: true,
            message: "Marks deleted successfully"
        });

    } catch (error) {
        console.error("Delete Marks Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    createMarks,
    getAllMarks,
    getMarksById,
    updateMarks,
    deleteMarks
};
