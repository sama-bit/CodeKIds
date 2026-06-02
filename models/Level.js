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
    codeTemplate: {
      type: String,
      required: true,
    },
    solution: {
      type: String,
      required: true,
    },
    availableTags: [
      {
        tag: String,
        description: String,
      },
    ],
    missions: [
      {
        id: String,
        description: String,
        validator: String,
      },
    ],
    hints: [String],
    points: {
      type: Number,
      default: 100,
    },
    starThresholds: {
      oneStar: { type: Number, default: 1 },
      twoStar: { type: Number, default: 3 },
      threeStar: { type: Number, default: 1 },
    },
    imageRef: {
      type: String,
    },
    // Grid/maze data for movement simulation
    // gridMap: 2D array where 0=open, 1=wall, 2=start, 3=goal, 4=item
    gridMap: {
      type: [[Number]],
      default: null,
    },
    // Grid dimensions
    gridCols: { type: Number, default: 6 },
    gridRows: { type: Number, default: 6 },
    // Starting position { row, col } and facing direction
    startPosition: {
      row: { type: Number, default: 0 },
      col: { type: Number, default: 0 },
    },
    startDirection: {
      type: String,
      enum: ['right', 'left', 'up', 'down'],
      default: 'right',
    },
    // Goal position
    goalPosition: {
      row: { type: Number, default: 5 },
      col: { type: Number, default: 5 },
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

levelSchema.index({ category: 1, levelNumber: 1 }, { unique: true });

module.exports = mongoose.model('Level', levelSchema);
