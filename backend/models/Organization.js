const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    logo: {
      type: String,
      default: null
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    },

    pincode: {
      type: String,
      required: true,
      trim: true
    },

    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    contactPhone: {
      type: String,
      required: true,
      trim: true
    },

    website: {
      type: String,
      trim: true,
      default: ""
    },

    academicYear: {
      type: String,
      required: true,
      trim: true
    },

    principal: {
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
      }
    },

    branding: {
      primaryColor: {
        type: String,
        default: "#1976d2"
      },
      secondaryColor: {
        type: String,
        default: "#424242"
      },
      accentColor: {
        type: String,
        default: "#ff4081"
      }
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// INDEXES
// ==========================================

// Compound unique index: support same school name in different academic years
organizationSchema.index(
  {
    name: 1,
    academicYear: 1
  },
  {
    unique: true
  }
);

organizationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Organization", organizationSchema);
