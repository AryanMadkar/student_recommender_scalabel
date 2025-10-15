const express = require('express');
const careerController = require('../controllers/career.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);

// Get career recommendations
router.post('/recommendations', careerController.getCareerRecommendations);

// Get all careers (browsing)
router.get('/', careerController.getAllCareers);

// Get career by ID
router.get('/:careerId', careerController.getCareerById);

module.exports = router;
