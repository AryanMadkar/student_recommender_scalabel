const express = require('express');
const collegeController = require('../controllers/college.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);

// Get college recommendations
router.post('/recommendations', collegeController.getCollegeRecommendations);

// Search colleges
router.get('/search', collegeController.searchColleges);

// Get college by ID
router.get('/:collegeId', collegeController.getCollegeById);

module.exports = router;
