const Faculty = require("../models/Faculty");
const mongoose = require("mongoose");

// CREATE FACULTY
const createFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create({
      ...req.body,
      organizationId: req.organizationId
    });

    res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      faculty
    });
  } catch (error) {
    console.error("Create faculty error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Faculty ID or email already exists"
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
      message: "Failed to create faculty"
    });
  }
};


// GET ALL / SEARCH / FILTER / PAGINATION
const getFaculties = async (req, res) => {
  try {
    const {
      search,
      department,
      designation,
      page = 1,
      limit = 10
    } = req.query;

    const filter = { organizationId: req.organizationId };

    // Search by name, faculty ID or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { facultyId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Department filter
    if (department) {
      filter.department = department;
    }

    // Designation filter
    if (designation) {
      filter.designation = designation;
    }

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

    const totalFaculty = await Faculty.countDocuments(filter);

    const faculties = await Faculty.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(totalFaculty / itemsPerPage);

    res.status(200).json({
      success: true,
      count: faculties.length,
      totalFaculty,
      currentPage,
      itemsPerPage,
      totalPages,
      faculties
    });

  } catch (error) {
    console.error("Get faculties error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty"
    });
  }
};


// GET SINGLE FACULTY
const getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID"
      });
    }

    const faculty = await Faculty.findOne({ _id: id, organizationId: req.organizationId });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    res.status(200).json({
      success: true,
      faculty
    });

  } catch (error) {
    console.error("Get faculty error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty"
    });
  }
};


// UPDATE FACULTY
const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID"
      });
    }

    const faculty = await Faculty.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      faculty
    });

  } catch (error) {
    console.error("Update faculty error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Faculty ID or email already exists"
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
      message: "Failed to update faculty"
    });
  }
};


// DELETE FACULTY
const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID"
      });
    }

    const faculty = await Faculty.findOneAndDelete({ _id: id, organizationId: req.organizationId });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully"
    });

  } catch (error) {
    console.error("Delete faculty error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete faculty"
    });
  }
};
// UPLOAD FACULTY PROFILE PICTURE
const uploadFacultyProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;

    // Check MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID"
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a profile picture"
      });
    }

    // Find faculty
    const faculty = await Faculty.findOne({ _id: id, organizationId: req.organizationId });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    // Save image URL
    faculty.profilePicture = `/uploads/${req.file.filename}`;

    await faculty.save();

    res.status(200).json({
      success: true,
      message: "Faculty profile picture uploaded successfully",
      faculty
    });

  } catch (error) {
    console.error("Faculty profile picture upload error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to upload faculty profile picture"
    });
  }
};


// EXPORT CONTROLLERS
module.exports = {
  createFaculty,
  getFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
  uploadFacultyProfilePicture
};
