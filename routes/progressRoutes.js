const express = require('express');
const router = express.Router();
const { submitCode, simulateOnly, getProgressOverview, getCategoryProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/progress/overview
router.get('/overview', getProgressOverview);

// GET /api/progress/scratch
router.get('/:category', getCategoryProgress);

// POST /api/progress/scratch/1/submit
router.post('/:category/:levelNumber/submit', submitCode);

// POST /api/progress/scratch/1/simulate  ← NEW: preview movement without saving
router.post('/:category/:levelNumber/simulate', simulateOnly);

module.exports = router;
