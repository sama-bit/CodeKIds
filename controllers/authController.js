const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Level = require('../models/Level');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { username, email, password, age, avatar } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      age,
      avatar: avatar || 'default_avatar',
    });

    // Initialize progress for all levels (locked by default)
    const allLevels = await Level.find({}).sort({ order: 1 });

    const progressDocs = allLevels.map((level) => ({
      user: user._id,
      level: level._id,
      category: level.category,
      levelNumber: level.levelNumber,
      // First level of each category starts unlocked
      status:
        level.levelNumber === 1
          ? 'unlocked'
          : 'locked',
    }));

    await UserProgress.insertMany(progressDocs);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        age: user.age,
        totalPoints: user.totalPoints,
        totalStars: user.totalStars,
        startMode: user.startMode,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Get user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update streak
    const today = new Date();
    const lastActivity = user.streak.lastActivityDate;
    if (lastActivity) {
      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        user.streak.count += 1;
      } else if (daysDiff > 1) {
        user.streak.count = 1;
      }
    } else {
      user.streak.count = 1;
    }
    user.streak.lastActivityDate = today;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        age: user.age,
        totalPoints: user.totalPoints,
        totalStars: user.totalStars,
        streak: user.streak.count,
        startMode: user.startMode,
        placementTestResult: user.placementTestResult,
        badges: user.badges,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    // Get overall stats
    const completedLevels = await UserProgress.countDocuments({
      user: user._id,
      status: 'completed',
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        age: user.age,
        totalPoints: user.totalPoints,
        totalStars: user.totalStars,
        streak: user.streak,
        startMode: user.startMode,
        placementTestResult: user.placementTestResult,
        badges: user.badges,
        completedLevels,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res, next) => {
  try {
    const { username, avatar, age } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, avatar, age },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated!',
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        age: user.age,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateMe };
