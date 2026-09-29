const Student = require("../models/Student");
const mongoose = require("mongoose");

// ==========================================
// CREATE STUDENT
// ==========================================

const createStudent = async (req, res) => {
  try {
    const student = await Student.create({
      ...req.body,
      organizationId: req.organizationId
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      student
    });

  } catch (error) {
    console.error("Create student error:", error);

    // Duplicate studentId or email
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Student ID or email already exists"
      });
    }

    // Validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create student"
    });
  }
};

// ==========================================
// BULK CREATE STUDENTS (Excel / CSV import)
// ==========================================

const bulkCreateStudents = async (req, res) => {
  try {
    const students = req.body.students;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a non-empty students array"
      });
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const data of students) {
      try {
        await Student.create({
          ...data,
          organizationId: req.organizationId
        });
        created++;
      } catch (err) {
        skipped++;
        errors.push({
          row: data,
          error: err.code === 11000 ? "Duplicate student ID or email" : err.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${created} students (${skipped} skipped)`,
      created,
      skipped,
      errors: errors.slice(0, 20)
    });

  } catch (error) {
    console.error("Bulk create students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk create students"
    });
  }
};


// ==========================================
// GET ALL STUDENTS
// SEARCH + FILTER + PAGINATION
// ==========================================

const getStudents = async (req, res) => {
  try {
    const {
      search,
      department,
      semester,
      page = 1,
      limit = 10
    } = req.query;

    // --------------------------------------
    // Build filter
    // --------------------------------------

    const filter = { organizationId: req.organizationId };

    // Search by name, student ID or email
    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i"
          }
        },
        {
          studentId: {
            $regex: search,
            $options: "i"
          }
        },
        {
          email: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    // Filter by department
    if (department) {
      filter.department = department;
    }

    // Filter by semester
    if (semester) {
      filter.semester = semester;
    }

    // --------------------------------------
    // Pagination
    // --------------------------------------

    let currentPage = Number(page);
    let itemsPerPage = Number(limit);

    if (
      Number.isNaN(currentPage) ||
      currentPage < 1
    ) {
      currentPage = 1;
    }

    if (
      Number.isNaN(itemsPerPage) ||
      itemsPerPage < 1
    ) {
      itemsPerPage = 10;
    }

    // Prevent extremely large requests
    if (itemsPerPage > 100) {
      itemsPerPage = 100;
    }

    const skip = (currentPage - 1) * itemsPerPage;

    // --------------------------------------
    // Count total matching students
    // --------------------------------------

    const totalStudents = await Student.countDocuments(filter);

    // --------------------------------------
    // Get students
    // --------------------------------------

    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    // --------------------------------------
    // Calculate total pages
    // --------------------------------------

    const totalPages = Math.ceil(
      totalStudents / itemsPerPage
    );

    // --------------------------------------
    // Response
    // --------------------------------------

    res.status(200).json({
      success: true,
      count: students.length,
      totalStudents,
      currentPage,
      itemsPerPage,
      totalPages,
      students
    });

  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch students"
    });
  }
};


// ==========================================
// GET SINGLE STUDENT
// ==========================================

// ==========================================
// GET SINGLE STUDENT
// ==========================================

const getStudentById = async (req, res) => {
  try {

    const { id } = req.params;

    console.log("Requested student ID:", id);
    console.log("Student ID length:", id.length);

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {

      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });

    }

    // Find student
    const student = await Student.findOne({ _id: id, organizationId: req.organizationId });

    if (!student) {

      return res.status(404).json({
        success: false,
        message: "Student not found"
      });

    }

    res.status(200).json({
      success: true,
      student
    });

  } catch (error) {

    console.error("Get student error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student"
    });

  }
};


// ==========================================
// UPDATE STUDENT
// ==========================================

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    const student = await Student.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student
    });

  } catch (error) {
    console.error("Update student error:", error);

    // Duplicate studentId or email
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Student ID or email already exists"
      });
    }

    // Validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update student"
    });
  }
};


// ==========================================
// DELETE STUDENT
// ==========================================

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    const student = await Student.findOneAndDelete({ _id: id, organizationId: req.organizationId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully"
    });

  } catch (error) {
    console.error("Delete student error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete student"
    });
  }
};
// ==========================================
// UPLOAD STUDENT PROFILE PICTURE
// ==========================================

const uploadProfilePicture = async (req, res) => {
  try {

    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image"
      });
    }

    // Find student
    const student = await Student.findOne({ _id: id, organizationId: req.organizationId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Save filename
    student.profilePicture = req.file.filename;

    await student.save();

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      profilePicture: req.file.filename,
      student
    });

  } catch (error) {

    console.error(
      "Profile picture upload error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to upload profile picture"
    });
  }
};



// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createStudent,
  bulkCreateStudents,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  uploadProfilePicture
};
