const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
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

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      default: "student"
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
// INDEXES
// ==========================================
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
userSchema.index({ organizationId: 1, role: 1 });

module.exports = mongoose.model("User", userSchema);
