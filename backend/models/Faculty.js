const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    facultyId: {
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

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },

    department: {
      type: String,
      required: true,
      trim: true
    },

    designation: {
      type: String,
      required: true,
      trim: true
    },

    qualification: {
      type: String,
      required: true,
      trim: true
    },

    experience: {
      type: Number,
      required: true,
      min: 0
    },

    joiningDate: {
      type: Date,
      required: true
    },

    address: {
      type: String,
      required: true,
      trim: true
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
facultySchema.index({ organizationId: 1, facultyId: 1 }, { unique: true });
facultySchema.index({ organizationId: 1, email: 1 }, { unique: true });
facultySchema.index({ organizationId: 1, name: 1 });
facultySchema.index({ organizationId: 1, department: 1 });
facultySchema.index({ organizationId: 1, designation: 1 });
facultySchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model("Faculty", facultySchema);
