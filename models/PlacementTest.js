const mongoose = require('mongoose');

const placementTestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['SCRATCH', 'PYTHON', 'HTML'],
      required: true,
    },
    questions: [
      {
        questionId: String,
        question: String,
        options: [String],
        correctAnswer: Number, // index of correct option
        userAnswer: Number,    // index chosen by user
        isCorrect: Boolean,
        points: Number,
      },
    ],
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    // Which level user is placed at based on score
    placedAtLevel: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    timeTaken: {
      type: Number, // seconds
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlacementTest', placementTestSchema);
