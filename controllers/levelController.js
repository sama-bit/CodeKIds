const Level = require('../models/Level');
const UserProgress = require('../models/UserProgress');

// @desc    Get all levels for a category
// @route   GET /api/levels/:category
// @access  Private
const getLevelsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const upperCategory = category.toUpperCase();

    if (!['SCRATCH', 'PYTHON', 'HTML'].includes(upperCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be SCRATCH, PYTHON, or HTML',
      });
    }

    // Get levels with user progress
    const levels = await Level.find({ category: upperCategory, isActive: true }).sort({ levelNumber: 1 });

    const progressRecords = await UserProgress.find({
      user: req.user._id,
      category: upperCategory,
    });

    const progressMap = {};
    progressRecords.forEach((p) => {
      progressMap[p.levelNumber] = p;
    });

    const levelsWithProgress = levels.map((level) => {
      const progress = progressMap[level.levelNumber];
      return {
        id: level._id,
        levelNumber: level.levelNumber,
        title: level.title,
        description: level.description,
        difficulty: level.difficulty,
        points: level.points,
        imageRef: level.imageRef,
        availableTags: level.availableTags,
        missions: level.missions.map((m) => ({
          id: m.id,
          description: m.description,
        })),
        // User progress
        status: progress ? progress.status : 'locked',
        starsEarned: progress ? progress.starsEarned : 0,
        pointsEarned: progress ? progress.pointsEarned : 0,
        attempts: progress ? progress.attempts : 0,
        completedMissions: progress ? progress.completedMissions : [],
        completedAt: progress ? progress.completedAt : null,
      };
    });

    res.json({
      success: true,
      category: upperCategory,
      totalLevels: levels.length,
      levels: levelsWithProgress,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single level with full details
// @route   GET /api/levels/:category/:levelNumber
// @access  Private
const getSingleLevel = async (req, res, next) => {
  try {
    const { category, levelNumber } = req.params;
    const upperCategory = category.toUpperCase();

    const level = await Level.findOne({
      category: upperCategory,
      levelNumber: parseInt(levelNumber),
      isActive: true,
    });

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found',
      });
    }

    // Get user's progress on this level
    const progress = await UserProgress.findOne({
      user: req.user._id,
      level: level._id,
    });

    // Check if this level is accessible
    if (progress && progress.status === 'locked') {
      return res.status(403).json({
        success: false,
        message: 'This level is locked. Complete previous levels first.',
      });
    }

    // Mark as in_progress if starting fresh
    if (progress && progress.status === 'unlocked') {
      progress.status = 'in_progress';
      progress.startedAt = progress.startedAt || new Date();
      await progress.save();
    }

    res.json({
      success: true,
      level: {
        id: level._id,
        category: level.category,
        levelNumber: level.levelNumber,
        title: level.title,
        description: level.description,
        difficulty: level.difficulty,
        codeTemplate: level.codeTemplate,
        availableTags: level.availableTags,
        missions: level.missions.map((m) => ({
          id: m.id,
          description: m.description,
        })),
        hints: progress && progress.hintsUsed > 0 ? level.hints.slice(0, progress.hintsUsed) : [],
        points: level.points,
        imageRef: level.imageRef,
      },
      progress: progress
        ? {
            status: progress.status,
            attempts: progress.attempts,
            starsEarned: progress.starsEarned,
            pointsEarned: progress.pointsEarned,
            completedMissions: progress.completedMissions,
            hintsUsed: progress.hintsUsed,
            currentCode: progress.currentCode,
            completedAt: progress.completedAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-save user's current code
// @route   PUT /api/levels/:category/:levelNumber/save
// @access  Private
const saveCode = async (req, res, next) => {
  try {
    const { category, levelNumber } = req.params;
    const { code } = req.body;
    const upperCategory = category.toUpperCase();

    const level = await Level.findOne({
      category: upperCategory,
      levelNumber: parseInt(levelNumber),
    });

    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    await UserProgress.findOneAndUpdate(
      { user: req.user._id, level: level._id },
      { currentCode: code },
      { new: true }
    );

    res.json({ success: true, message: 'Code saved!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a hint for a level
// @route   GET /api/levels/:category/:levelNumber/hint
// @access  Private
const getHint = async (req, res, next) => {
  try {
    const { category, levelNumber } = req.params;
    const upperCategory = category.toUpperCase();

    const level = await Level.findOne({
      category: upperCategory,
      levelNumber: parseInt(levelNumber),
    });

    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    const progress = await UserProgress.findOne({
      user: req.user._id,
      level: level._id,
    });

    const hintsUsed = progress ? progress.hintsUsed : 0;
    const nextHintIndex = hintsUsed;

    if (nextHintIndex >= level.hints.length) {
      return res.json({
        success: true,
        hint: null,
        message: 'No more hints available!',
        allHintsUsed: true,
      });
    }

    if (progress) {
      progress.hintsUsed += 1;
      await progress.save();
    }

    res.json({
      success: true,
      hint: level.hints[nextHintIndex],
      hintsRemaining: level.hints.length - (nextHintIndex + 1),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLevelsByCategory, getSingleLevel, saveCode, getHint };
