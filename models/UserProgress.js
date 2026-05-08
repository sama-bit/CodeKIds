const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
      required: true,
    },
    category: {
      type: String,
      enum: ['SCRATCH', 'PYTHON', 'HTML'],
      required: true,
    },
    levelNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['locked', 'unlocked', 'in_progress', 'completed'],
      default: 'locked',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    // User's submitted code attempts history
    submissions: [
      {
        code: String,
        isCorrect: Boolean,
        missionsCompleted: [String],
        submittedAt: { type: Date, default: Date.now },
        timeTaken: Number, // seconds
      },
    ],
    // Last code the user was working on (auto-saved)
    currentCode: {
      type: String,
      default: '',
    },
    completedMissions: [String],
    starsEarned: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    hintsUsed: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    timeTaken: {
      type: Number, // total seconds spent
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One progress record per user per level
userProgressSchema.index({ user: 1, level: 1 }, { unique: true });
userProgressSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('UserProgress', userProgressSchema);
