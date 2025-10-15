const express = require('express');
const aiController = require('../controllers/ai.controller');
const router = express.Router();

// Generate comprehensive recommendations
router.post('/recommendations', aiController.generateRecommendations);

// Get recommendation history
router.get('/history', aiController.getHistory);

// Provide feedback on recommendation
router.post('/recommendations/:recommendationId/feedback', aiController.provideFeedback);

module.exports = router;
