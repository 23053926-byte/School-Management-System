const Subject = require("../models/Subject");
const mongoose = require("mongoose");

// ==========================================
// CREATE SUBJECT
// ==========================================

const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create({
      ...req.body,
      organizationId: req.organizationId
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject
    });

  } catch (error) {
    console.error("Create subject error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Subject ID or subject code already exists"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create subject"
    });
  }
};


// ==========================================
// GET ALL / SEARCH / FILTER / PAGINATION
// ==========================================

const getSubjects = async (req, res) => {
  try {
    const {
      search,
      department,
      course,
      semester,
      faculty,
      page = 1,
      limit = 10
    } = req.query;

    const filter = { organizationId: req.organizationId };

    // Search
    if (search) {
      filter.$or = [
        {
          subjectId: {
            $regex: search,
            $options: "i"
          }
        },
        {
          subjectCode: {
            $regex: search,
            $options: "i"
          }
        },
        {
          subjectName: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    // Department filter
    if (department) {
      filter.department = department;
    }

    // Course filter
    if (course) {
      filter.course = course;
    }

    // Semester filter
    if (semester) {
      filter.semester = semester;
    }

    // Faculty filter
    if (faculty) {
      if (!mongoose.Types.ObjectId.isValid(faculty)) {
        return res.status(400).json({
          success: false,
          message: "Invalid faculty ID"
        });
      }

      filter.faculty = faculty;
    }

    // Pagination
    let currentPage = Number(page);
    let itemsPerPage = Number(limit);

    if (Number.isNaN(currentPage) || currentPage < 1) {
      currentPage = 1;
    }

    if (Number.isNaN(itemsPerPage) || itemsPerPage < 1) {
      itemsPerPage = 10;
    }

    if (itemsPerPage > 100) {
      itemsPerPage = 100;
    }

    const skip = (currentPage - 1) * itemsPerPage;

    const totalSubjects = await Subject.countDocuments(filter);

    const subjects = await Subject.find(filter)
      .populate("faculty", "facultyId name email department designation")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(totalSubjects / itemsPerPage);

    res.status(200).json({
      success: true,
      count: subjects.length,
      totalSubjects,
      currentPage,
      itemsPerPage,
      totalPages,
      subjects
    });

  } catch (error) {
    console.error("Get subjects error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects"
    });
  }
};


// ==========================================
// GET SUBJECT BY ID
// ==========================================

const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }

    const subject = await Subject.findOne({ _id: id, organizationId: req.organizationId })
      .populate(
        "faculty",
        "facultyId name email department designation"
      );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      subject
    });

  } catch (error) {
    console.error("Get subject error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subject"
    });
  }
};


// ==========================================
// UPDATE SUBJECT
// ==========================================

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate(
      "faculty",
      "facultyId name email department designation"
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject
    });

  } catch (error) {
    console.error("Update subject error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Subject ID or subject code already exists"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update subject"
    });
  }
};


// ==========================================
// DELETE SUBJECT
// ==========================================

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }

    const subject = await Subject.findOneAndDelete({ _id: id, organizationId: req.organizationId });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully"
    });

  } catch (error) {
    console.error("Delete subject error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete subject"
    });
  }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
};
