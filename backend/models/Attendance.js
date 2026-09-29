const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },

    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      required: true,
      enum: ["Present", "Absent", "Late"]
    },

    remarks: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);


// Prevent duplicate attendance for the same
// student + subject + date in the same organization
attendanceSchema.index(
  {
    organizationId: 1,
    student: 1,
    subject: 1,
    date: 1
  },
  {
    unique: true
  }
);

// ==========================================
// INDEXES (performance & scoping)
// ==========================================
attendanceSchema.index({ organizationId: 1, date: -1 });
attendanceSchema.index({ organizationId: 1, status: 1 });
attendanceSchema.index({ organizationId: 1, faculty: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
