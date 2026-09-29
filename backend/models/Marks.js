const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
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

        internalMarks: {
            type: Number,
            required: true,
            min: 0,
            max: 40
        },

        externalMarks: {
            type: Number,
            required: true,
            min: 0,
            max: 60
        },

        totalMarks: {
            type: Number
        },

        grade: {
            type: String
        },

        gradePoint: {
            type: Number
        },

        result: {
            type: String,
            enum: ["Pass", "Fail"]
        },

        remarks: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate marks for the same student and subject in the same organization
marksSchema.index(
    {
        organizationId: 1,
        student: 1,
        subject: 1
    },
    {
        unique: true
    }
);

// ==========================================
// INDEXES (performance & scoping)
// ==========================================
marksSchema.index({ organizationId: 1, subject: 1 });
marksSchema.index({ organizationId: 1, result: 1 });
marksSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model("Marks", marksSchema);
