const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    studentId: {
      type: String,
      required: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    dateOfBirth: {
      type: Date,
      required: true
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    department: {
      type: String,
      required: true,
      trim: true
    },

    course: {
      type: String,
      required: true,
      trim: true
    },

    semester: {
      type: String,
      required: true,
      trim: true
    },

    admissionYear: {
      type: Number,
      required: true
    },

    profilePicture: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// INDEXES (performance & scoping)
// ==========================================
studentSchema.index({ organizationId: 1, studentId: 1 }, { unique: true });
studentSchema.index({ organizationId: 1, email: 1 }, { unique: true });
studentSchema.index({ organizationId: 1, name: 1 });
studentSchema.index({ organizationId: 1, department: 1, semester: 1 });
studentSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model("Student", studentSchema);
