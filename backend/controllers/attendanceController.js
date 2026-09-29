const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const mongoose = require("mongoose");
const yoloService = require("../services/yoloFaceDetectionService");

// ==========================================
// CREATE ATTENDANCE
// ==========================================

const createAttendance = async (req, res) => {
  try {
    const {
      student,
      subject,
      faculty,
      date,
      status,
      remarks
    } = req.body;

    // Validate Student ID
    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    // Validate Subject ID
    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }

    // Validate Faculty ID
    if (!mongoose.Types.ObjectId.isValid(faculty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID"
      });
    }

    const attendance = await Attendance.create({
      organizationId: req.organizationId,
      student,
      subject,
      faculty,
      date,
      status,
      remarks
    });

    const populatedAttendance = await Attendance.findOne({
      _id: attendance._id,
      organizationId: req.organizationId
    })
      .populate(
        "student",
        "studentId name email department course semester"
      )
      .populate(
        "subject",
        "subjectId subjectCode subjectName department course semester credits"
      )
      .populate(
        "faculty",
        "facultyId name email department designation"
      );

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance: populatedAttendance
    });

  } catch (error) {
    console.error("Create attendance error:", error);

    // Duplicate attendance
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for this student, subject and date"
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
      message: "Failed to mark attendance"
    });
  }
};


// ==========================================
// GET ATTENDANCE
// SEARCH / FILTER / PAGINATION
// ==========================================

const getAttendance = async (req, res) => {
  try {
    const {
      student,
      subject,
      faculty,
      status,
      date,
      fromDate,
      toDate,
      page = 1,
      limit = 10
    } = req.query;

    const filter = { organizationId: req.organizationId };

    // Student filter
    if (student) {
      if (!mongoose.Types.ObjectId.isValid(student)) {
        return res.status(400).json({
          success: false,
          message: "Invalid student ID"
        });
      }

      filter.student = student;
    }

    // Subject filter
    if (subject) {
      if (!mongoose.Types.ObjectId.isValid(subject)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subject ID"
        });
      }

      filter.subject = subject;
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

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Exact date
    if (date) {
      const start = new Date(date);
      const end = new Date(date);

      end.setDate(end.getDate() + 1);

      filter.date = {
        $gte: start,
        $lt: end
      };
    }

    // Date range
    if (fromDate || toDate) {
      filter.date = {};

      if (fromDate) {
        filter.date.$gte = new Date(fromDate);
      }

      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);

        filter.date.$lt = endDate;
      }
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

    const totalAttendance = await Attendance.countDocuments(filter);

    const attendance = await Attendance.find(filter)
      .populate(
        "student",
        "studentId name email department course semester"
      )
      .populate(
        "subject",
        "subjectId subjectCode subjectName department course semester credits"
      )
      .populate(
        "faculty",
        "facultyId name email department designation"
      )
      .sort({ date: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    const totalPages = Math.ceil(
      totalAttendance / itemsPerPage
    );

    res.status(200).json({
      success: true,
      count: attendance.length,
      totalAttendance,
      currentPage,
      itemsPerPage,
      totalPages,
      attendance
    });

  } catch (error) {
    console.error("Get attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance"
    });
  }
};


// ==========================================
// GET ATTENDANCE BY ID
// ==========================================

const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID"
      });
    }

    const attendance = await Attendance.findOne({ _id: id, organizationId: req.organizationId })
      .populate(
        "student",
        "studentId name email department course semester"
      )
      .populate(
        "subject",
        "subjectId subjectCode subjectName department course semester credits"
      )
      .populate(
        "faculty",
        "facultyId name email department designation"
      );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      attendance
    });

  } catch (error) {
    console.error("Get attendance by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance record"
    });
  }
};


// ==========================================
// UPDATE ATTENDANCE
// ==========================================

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID"
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate(
        "student",
        "studentId name email department course semester"
      )
      .populate(
        "subject",
        "subjectId subjectCode subjectName department course semester credits"
      )
      .populate(
        "faculty",
        "facultyId name email department designation"
      );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance
    });

  } catch (error) {
    console.error("Update attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update attendance"
    });
  }
};


// ==========================================
// DELETE ATTENDANCE
// ==========================================

const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID"
      });
    }

    const attendance = await Attendance.findOneAndDelete({ _id: id, organizationId: req.organizationId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance deleted successfully"
    });

  } catch (error) {
    console.error("Delete attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete attendance"
    });
  }
};

// ==========================================
// ATTENDANCE SUMMARY
// ==========================================

const getAttendanceSummary = async (req, res) => {
  try {
    const { student, subject } = req.query;

    if (!student || !subject) {
      return res.status(400).json({
        success: false,
        message: "Student and subject are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }

    const records = await Attendance.find({
      organizationId: req.organizationId,
      student,
      subject
    })
      .populate(
        "student",
        "studentId name email department course semester"
      )
      .populate(
        "subject",
        "subjectId subjectCode subjectName department course semester credits"
      )
      .populate(
        "faculty",
        "facultyId name email department designation"
      )
      .sort({ date: 1 });

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found"
      });
    }

    const totalClasses = records.length;

    const present = records.filter(
      record => record.status === "Present"
    ).length;

    const absent = records.filter(
      record => record.status === "Absent"
    ).length;

    const late = records.filter(
      record => record.status === "Late"
    ).length;

    const attendancePercentage =
      ((present + late) / totalClasses) * 100;

    res.status(200).json({
      success: true,

      student: records[0].student,

      subject: records[0].subject,

      summary: {
        totalClasses,
        present,
        absent,
        late,
        attendancePercentage: Number(
          attendancePercentage.toFixed(2)
        )
      },

      records
    });

  } catch (error) {
    console.error("Attendance summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate attendance summary"
    });
  }
};


// ==========================================
// ATTENDANCE PERCENTAGE
// ==========================================

const getAttendancePercentage = async (req, res) => {
  try {
    const { student, subject } = req.query;

    if (!student || !subject) {
      return res.status(400).json({
        success: false,
        message: "Student and subject are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }

    const records = await Attendance.find({
      organizationId: req.organizationId,
      student,
      subject
    });

    const totalClasses = records.length;

    if (totalClasses === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found"
      });
    }

    const present = records.filter(
      record => record.status === "Present"
    ).length;

    const absent = records.filter(
      record => record.status === "Absent"
    ).length;

    const late = records.filter(
      record => record.status === "Late"
    ).length;

    const percentage =
      ((present + late) / totalClasses) * 100;

    res.status(200).json({
      success: true,

      student,
      subject,

      totalClasses,
      present,
      absent,
      late,

      attendancePercentage: Number(
        percentage.toFixed(2)
      )
    });

  } catch (error) {
    console.error("Attendance percentage error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to calculate attendance percentage"
    });
  }
};
// ==========================================
// YOLO FACE DETECTION - DETECT FACES
// ==========================================

const yoloDetectAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a classroom image"
      });
    }

    const { department, semester, subjectId } = req.body;

    if (!department || !semester) {
      return res.status(400).json({
        success: false,
        message: "Department and semester are required"
      });
    }

    // Fetch enrolled students with profile pictures
    const enrolledStudents = await yoloService.getEnrolledStudents(
      Student,
      department,
      semester,
      req.organizationId
    );

    if (enrolledStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No enrolled students with profile pictures found for this department and semester"
      });
    }

    // Prepare student data with full file paths for YOLO service
    const studentsForMatching = enrolledStudents.map(s => ({
      _id: s._id,
      studentId: s.studentId,
      name: s.name,
      profilePicture: s.profilePicture
        ? require("path").join(__dirname, "../uploads", s.profilePicture)
        : null
    }));

    // Run YOLO face detection and matching
    const imagePath = require("path").join(__dirname, "../uploads", req.file.filename);
    const detectionResult = await yoloService.detectFacesAndMatch(
      imagePath,
      studentsForMatching
    );

    if (!detectionResult.success) {
      return res.status(500).json({
        success: false,
        message: "Face detection failed: " + (detectionResult.error || "Unknown error")
      });
    }

    res.status(200).json({
      success: true,
      imageWidth: detectionResult.imageWidth,
      imageHeight: detectionResult.imageHeight,
      imagePath: `/uploads/${req.file.filename}`,
      detections: detectionResult.detections
    });

  } catch (error) {
    console.error("YOLO detect attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to detect faces"
    });
  }
};


// ==========================================
// YOLO FACE DETECTION - MARK ATTENDANCE
// ==========================================

const yoloMarkAttendance = async (req, res) => {
  try {
    const { subject, faculty, date, records } = req.body;

    if (!subject || !faculty || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Subject, faculty, date, and records are required"
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(subject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(faculty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID"
      });
    }

    // Prepare bulk write operations
    const bulkOps = records.map(record => ({
      updateOne: {
        filter: {
          organizationId: req.organizationId,
          student: record.student,
          subject,
          date: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).getTime() + 86400000) // Next day
          }
        },
        update: {
          $set: {
            status: record.status,
            faculty,
            remarks: `Auto-marked via YOLO face detection (confidence: ${record.confidence})`
          }
        },
        upsert: true
      }
    }));

    // Execute bulk write
    const result = await Attendance.collection.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      summary: {
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
        total: records.length
      }
    });

  } catch (error) {
    console.error("YOLO mark attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to mark attendance"
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary,
  getAttendancePercentage,
  yoloDetectAttendance,
  yoloMarkAttendance
};