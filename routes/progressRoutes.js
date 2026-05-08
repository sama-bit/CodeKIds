const express = require('express');
const router = express.Router();
const { submitCode, getProgressOverview, getCategoryProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/progress/overview             → full progress across all categories
router.get('/overview', getProgressOverview);

// GET /api/progress/scratch              → progress in scratch only
router.get('/:category', getCategoryProgress);

// POST /api/progress/scratch/1/submit    → submit code for level 1 of scratch
router.post('/:category/:levelNumber/submit', submitCode);

module.exports = router;
