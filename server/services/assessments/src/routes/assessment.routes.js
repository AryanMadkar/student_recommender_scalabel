const express = require('express');
const assessmentController = require('../controllers/assessment.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// ============================================
// APPLY AUTH MIDDLEWARE TO ALL ROUTES
// ============================================
router.use(authMiddleware);

// ============================================
// ASSESSMENT ROUTES (All Protected)
// ============================================

// Get all assessments
router.get('/assessments', assessmentController.getAssessments);

// Start an assessment
router.get('/assessments/:assessmentId/start', assessmentController.startAssessment);

// Submit assessment
router.post('/assessments/:assessmentId/submit', assessmentController.submitAssessment);

// Get user's results
router.get('/results', assessmentController.getResults);

// Get specific result
router.get('/results/:resultId', assessmentController.getResultById);

// Get user statistics
router.get('/statistics', assessmentController.getStatistics);

// Compare results
router.get('/compare', assessmentController.compareResults);

module.exports = router;
