const express = require('express');
const router = express.Router();
const { getPlacementQuestions, submitPlacementTest, getPlacementHistory } = require('../controllers/placementController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/placement/history                   → user's past tests
router.get('/history', getPlacementHistory);

// GET /api/placement/scratch/questions         → get test questions
router.get('/:category/questions', getPlacementQuestions);

// POST /api/placement/scratch/submit           → submit test, get placed
router.post('/:category/submit', submitPlacementTest);

module.exports = router;
