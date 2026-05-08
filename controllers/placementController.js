const PlacementTest = require('../models/PlacementTest');
const UserProgress = require('../models/UserProgress');
const Level = require('../models/Level');
const User = require('../models/User');
const { placementQuestions, calculatePlacementLevel } = require('../data/placementQuestions');

// @desc    Get placement test questions for a category
// @route   GET /api/placement/:category/questions
// @access  Private
const getPlacementQuestions = async (req, res, next) => {
  try {
    const { category } = req.params;
    const upperCategory = category.toUpperCase();

    if (!['SCRATCH', 'PYTHON', 'HTML'].includes(upperCategory)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const questions = placementQuestions[upperCategory];

    // Return questions WITHOUT the correct answers
    const safeQuestions = questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      points: q.points,
      difficulty: q.difficulty,
    }));

    res.json({
      success: true,
      category: upperCategory,
      totalQuestions: questions.length,
      questions: safeQuestions,
      instructions: 'Answer these questions to find your starting level. You can always go back to level 1.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit placement test answers and get placed
// @route   POST /api/placement/:category/submit
// @access  Private
const submitPlacementTest = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { answers, timeTaken } = req.body;
    // answers: [{ questionId, answer (index) }]
    const upperCategory = category.toUpperCase();

    if (!['SCRATCH', 'PYTHON', 'HTML'].includes(upperCategory)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers are required' });
    }

    const questions = placementQuestions[upperCategory];
    let score = 0;
    let correctAnswers = 0;
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    const evaluatedQuestions = questions.map((q) => {
      const userAnswer = answers.find((a) => a.questionId === q.id);
      const userAnswerIndex = userAnswer ? userAnswer.answer : -1;
      const isCorrect = userAnswerIndex === q.correctAnswer;

      if (isCorrect) {
        score += q.points;
        correctAnswers += 1;
      }

      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswerIndex,
        isCorrect,
        points: q.points,
      };
    });

    const placedAtLevel = calculatePlacementLevel(score, totalPoints);

    // Save placement test result
    const testResult = await PlacementTest.create({
      user: req.user._id,
      category: upperCategory,
      questions: evaluatedQuestions,
      totalQuestions: questions.length,
      correctAnswers,
      score,
      placedAtLevel,
      timeTaken: timeTaken || 0,
    });

    // Update user's placement result
    const user = await User.findById(req.user._id);
    user.startMode = 'placement_test';
    user.placementTestResult = {
      category: upperCategory,
      startLevel: placedAtLevel,
      score,
      completedAt: new Date(),
    };
    await user.save();

    // Unlock all levels up to placed level
    const levelsToUnlock = await Level.find({
      category: upperCategory,
      levelNumber: { $lte: placedAtLevel },
    });

    for (const level of levelsToUnlock) {
      await UserProgress.findOneAndUpdate(
        { user: req.user._id, level: level._id },
        {
          status: level.levelNumber === placedAtLevel ? 'unlocked' : 'completed',
          // Mark earlier levels as skipped/completed for context
          starsEarned: level.levelNumber < placedAtLevel ? 0 : 0,
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      result: {
        score,
        totalPoints,
        correctAnswers,
        totalQuestions: questions.length,
        percentage: Math.round((score / totalPoints) * 100),
        placedAtLevel,
        message: getPlacementMessage(placedAtLevel),
        testId: testResult._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's placement test history
// @route   GET /api/placement/history
// @access  Private
const getPlacementHistory = async (req, res, next) => {
  try {
    const tests = await PlacementTest.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      tests: tests.map((t) => ({
        id: t._id,
        category: t.category,
        score: t.score,
        correctAnswers: t.correctAnswers,
        totalQuestions: t.totalQuestions,
        placedAtLevel: t.placedAtLevel,
        completedAt: t.completedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getPlacementMessage = (level) => {
  if (level >= 8) return '🌟 Amazing! You are an advanced coder! Starting from level 8.';
  if (level >= 6) return '🔥 Great job! You already know quite a bit! Starting from level 6.';
  if (level >= 4) return '👍 Nice! You have some coding knowledge! Starting from level 4.';
  if (level >= 2) return '✨ Good start! A little knowledge goes a long way! Starting from level 2.';
  return '🚀 Everyone starts somewhere! Let\'s begin from the very beginning!';
};

module.exports = { getPlacementQuestions, submitPlacementTest, getPlacementHistory };
