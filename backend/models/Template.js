const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['report', 'admit'], required: true },
    description: { type: String, default: '' },
    fields: [
      {
        id: String,
        label: String,
        visible: Boolean,
        position: Number
      }
    ],
    customization: {
      schoolName: String,
      schoolAddress: String,
      examName: String,
      accentColor: String,
      principalSignature: String,
      classTeacherNote: String,
      showLogo: { type: Boolean, default: true },
      showPhoto: { type: Boolean, default: true },
      showGrade: { type: Boolean, default: true },
      showAttendance: { type: Boolean, default: true }
    },
    layout: {
      headerHeight: { type: Number, default: 100 },
      footerHeight: { type: Number, default: 80 },
      backgroundColor: { type: String, default: '#ffffff' },
      borderStyle: { type: String, default: 'solid' },
      fontSize: { type: Number, default: 12 }
    },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for organization and type
templateSchema.index({ organizationId: 1, type: 1 });
templateSchema.index({ organizationId: 1, isDefault: 1 });

module.exports = mongoose.model('Template', templateSchema);
