const Level = require('../models/Level');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const { validateSubmission, calculateStars } = require('../utils/codeValidator');

// @desc    Submit code for a level
// @route   POST /api/progress/:category/:levelNumber/submit
// @access  Private
const submitCode = async (req, res, next) => {
  try {
    const { category, levelNumber } = req.params;
    const { code, timeTaken } = req.body;
    const upperCategory = category.toUpperCase();

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const level = await Level.findOne({
      category: upperCategory,
      levelNumber: parseInt(levelNumber),
    });

    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    let progress = await UserProgress.findOne({
      user: req.user._id,
      level: level._id,
    });

    if (!progress || progress.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Level is locked' });
    }

    // Validate submission
    const validation = validateSubmission(code, level.missions);

    // Increment attempts
    progress.attempts += 1;
    progress.currentCode = code;

    // Record submission
    const submission = {
      code,
      isCorrect: validation.allPassed,
      missionsCompleted: validation.completedMissions,
      timeTaken: timeTaken || 0,
    };
    progress.submissions.push(submission);
    progress.completedMissions = [...new Set([...progress.completedMissions, ...validation.completedMissions])];

    let unlocked_next = false;
    let newBadges = [];

    if (validation.allPassed) {
      // Calculate stars based on attempts
      const stars = calculateStars(progress.attempts, level.starThresholds);

      // Only update if better than before
      if (progress.status !== 'completed' || stars > progress.starsEarned) {
        const pointsEarned = Math.round(level.points * (stars / 3));

        if (progress.status !== 'completed') {
          // First time completion
          progress.status = 'completed';
          progress.starsEarned = stars;
          progress.pointsEarned = pointsEarned;
          progress.completedAt = new Date();
          progress.timeTaken = timeTaken || 0;

          // Add points and stars to user
          const user = await User.findById(req.user._id);
          user.totalPoints += pointsEarned;
          user.totalStars += stars;

          // Check badges
          newBadges = await checkAndAwardBadges(user, upperCategory, parseInt(levelNumber));
          await user.save();

          // Unlock next level
          const nextLevelNum = parseInt(levelNumber) + 1;
          if (nextLevelNum <= 10) {
            const nextLevel = await Level.findOne({
              category: upperCategory,
              levelNumber: nextLevelNum,
            });
            if (nextLevel) {
              await UserProgress.findOneAndUpdate(
                { user: req.user._id, level: nextLevel._id },
                { status: 'unlocked' },
                { new: true }
              );
              unlocked_next = true;
            }
          }
        } else if (stars > progress.starsEarned) {
          // Better performance on re-attempt
          const bonusPoints = pointsEarned - progress.pointsEarned;
          progress.starsEarned = stars;
          progress.pointsEarned = pointsEarned;

          if (bonusPoints > 0) {
            const user = await User.findById(req.user._id);
            user.totalPoints += bonusPoints;
            user.totalStars += stars - progress.starsEarned;
            await user.save();
          }
        }
      }
    }

    await progress.save();

    res.json({
      success: true,
      result: {
        allPassed: validation.allPassed,
        completedMissions: validation.completedMissions,
        failedMissions: validation.failedMissions,
        completionPercentage: validation.completionPercentage,
        attempts: progress.attempts,
        starsEarned: progress.starsEarned,
        pointsEarned: progress.pointsEarned,
        unlockedNextLevel: unlocked_next,
        nextLevel: unlocked_next ? parseInt(levelNumber) + 1 : null,
        newBadges,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's full progress overview
// @route   GET /api/progress/overview
// @access  Private
const getProgressOverview = async (req, res, next) => {
  try {
    const allProgress = await UserProgress.find({ user: req.user._id })
      .populate('level', 'title category levelNumber points difficulty')
      .sort({ category: 1, levelNumber: 1 });

    const categories = ['SCRATCH', 'PYTHON', 'HTML'];
    const overview = {};

    for (const cat of categories) {
      const catProgress = allProgress.filter((p) => p.category === cat);
      const completed = catProgress.filter((p) => p.status === 'completed');
      const totalStars = completed.reduce((sum, p) => sum + p.starsEarned, 0);
      const totalPoints = completed.reduce((sum, p) => sum + p.pointsEarned, 0);

      overview[cat] = {
        totalLevels: 10,
        completedLevels: completed.length,
        totalStars,
        maxStars: 30, // 10 levels × 3 stars
        totalPoints,
        progressPercentage: Math.round((completed.length / 10) * 100),
        currentLevel: catProgress.find((p) => p.status === 'in_progress' || p.status === 'unlocked')?.levelNumber || null,
        levels: catProgress.map((p) => ({
          levelNumber: p.levelNumber,
          title: p.level?.title,
          status: p.status,
          starsEarned: p.starsEarned,
          attempts: p.attempts,
        })),
      };
    }

    const user = req.user;
    res.json({
      success: true,
      overview: {
        totalPoints: user.totalPoints,
        totalStars: user.totalStars,
        streak: user.streak,
        badges: user.badges,
        categories: overview,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress for a specific category
// @route   GET /api/progress/:category
// @access  Private
const getCategoryProgress = async (req, res, next) => {
  try {
    const { category } = req.params;
    const upperCategory = category.toUpperCase();

    const progress = await UserProgress.find({
      user: req.user._id,
      category: upperCategory,
    }).sort({ levelNumber: 1 });

    res.json({
      success: true,
      category: upperCategory,
      progress: progress.map((p) => ({
        levelNumber: p.levelNumber,
        status: p.status,
        starsEarned: p.starsEarned,
        pointsEarned: p.pointsEarned,
        attempts: p.attempts,
        completedMissions: p.completedMissions,
        completedAt: p.completedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Helper: check and award badges
const checkAndAwardBadges = async (user, category, levelNumber) => {
  const newBadges = [];

  const categoryProgress = await UserProgress.find({
    user: user._id,
    category,
    status: 'completed',
  });

  // First level badge
  if (levelNumber === 1 && !user.badges.find((b) => b.badgeId === `first_${category.toLowerCase()}`)) {
    const badge = {
      badgeId: `first_${category.toLowerCase()}`,
      name: `First ${category} Level!`,
      earnedAt: new Date(),
    };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  // Category complete badge
  if (categoryProgress.length === 10 && !user.badges.find((b) => b.badgeId === `complete_${category.toLowerCase()}`)) {
    const badge = {
      badgeId: `complete_${category.toLowerCase()}`,
      name: `${category} Master!`,
      earnedAt: new Date(),
    };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  // All 3 categories complete
  const allCompleted = await UserProgress.countDocuments({ user: user._id, status: 'completed' });
  if (allCompleted === 30 && !user.badges.find((b) => b.badgeId === 'grand_master')) {
    const badge = {
      badgeId: 'grand_master',
      name: 'Grand Master Coder!',
      earnedAt: new Date(),
    };
    user.badges.push(badge);
    newBadges.push(badge);
  }

  return newBadges;
};

module.exports = { submitCode, getProgressOverview, getCategoryProgress };
