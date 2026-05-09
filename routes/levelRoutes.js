const express = require('express');
const router = express.Router();
const { getLevelsByCategory, getSingleLevel, saveCode, getHint } = require('../controllers/levelController');
const { protect } = require('../middleware/auth');

// All level routes require auth
router.use(protect);

// GET /api/levels/scratch          → all Scratch levels
// GET /api/levels/python           → all Python levels
// GET /api/levels/html             → all HTML levels
router.get('/:category', getLevelsByCategory);

// GET /api/levels/scratch/1        → level 1 of Scratch
router.get('/:category/:levelNumber', getSingleLevel);

// PUT /api/levels/scratch/1/save   → auto-save code
router.put('/:category/:levelNumber/save', saveCode);

// GET /api/levels/scratch/1/hint   → get next hint
router.get('/:category/:levelNumber/hint', getHint);

module.exports = router;
