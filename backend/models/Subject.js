const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    subjectId: {
      type: String,
      required: true,
      trim: true
    },

    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    subjectName: {
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

    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },

    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null
    },

    description: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// INDEXES (performance & scoping)
// ==========================================
subjectSchema.index({ organizationId: 1, subjectId: 1 }, { unique: true });
subjectSchema.index({ organizationId: 1, subjectCode: 1 }, { unique: true });
subjectSchema.index({ organizationId: 1, department: 1, semester: 1 });
subjectSchema.index({ organizationId: 1, faculty: 1 });
subjectSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model("Subject", subjectSchema);
