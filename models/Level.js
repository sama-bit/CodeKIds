const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['SCRATCH', 'PYTHON', 'HTML'],
      uppercase: true,
    },
    levelNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    // The incomplete code template shown to the user
    codeTemplate: {
      type: String,
      required: true,
    },
    // The correct solution
    solution: {
      type: String,
      required: true,
    },
    // Available tags/commands the user can use
    availableTags: [
      {
        tag: String,
        description: String,
      },
    ],
    // Mission objectives (checkboxes)
    missions: [
      {
        id: String,
        description: String,
        // For validation: what to check in the code
        validator: String,
      },
    ],
    // Hints shown progressively
    hints: [String],
    // Points awarded on completion
    points: {
      type: Number,
      default: 100,
    },
    // Stars (1-3) based on performance
    starThresholds: {
      oneStar: { type: Number, default: 1 },   // min attempts
      twoStar: { type: Number, default: 3 },
      threeStar: { type: Number, default: 1 },  // first try
    },
    // Image reference from the zip
    imageRef: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
levelSchema.index({ category: 1, levelNumber: 1 }, { unique: true });

module.exports = mongoose.model('Level', levelSchema);
