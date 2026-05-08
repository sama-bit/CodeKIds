const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: 'default_avatar',
    },
    age: {
      type: Number,
      min: 5,
      max: 18,
    },
    // How the user started: 'from_start' or 'placement_test'
    startMode: {
      type: String,
      enum: ['from_start', 'placement_test'],
      default: 'from_start',
    },
    // Placement test result (if they took it)
    placementTestResult: {
      category: { type: String, enum: ['SCRATCH', 'PYTHON', 'HTML'] },
      startLevel: { type: Number },
      score: { type: Number },
      completedAt: { type: Date },
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    totalStars: {
      type: Number,
      default: 0,
    },
    streak: {
      count: { type: Number, default: 0 },
      lastActivityDate: { type: Date },
    },
    badges: [
      {
        badgeId: String,
        name: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add points method
userSchema.methods.addPoints = function (points) {
  this.totalPoints += points;
};

module.exports = mongoose.model('User', userSchema);
