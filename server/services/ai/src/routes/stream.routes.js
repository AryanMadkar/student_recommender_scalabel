const express = require('express');
const streamController = require('../controllers/stream.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);

// Get stream recommendations (after 10th)
router.post('/recommendations', streamController.getStreamRecommendations);

module.exports = router;
