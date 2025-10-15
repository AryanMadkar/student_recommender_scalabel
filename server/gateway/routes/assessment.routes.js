const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();
const ASSESSMENT_SERVICE = process.env.ASSESSMENT_SERVICE_URL;

console.log('📝 Assessment Routes - Service URL:', ASSESSMENT_SERVICE);

// Apply auth middleware to ALL routes
router.use(authMiddleware);

// Get all assessments
router.get('/', async (req, res, next) => {
  try {
    console.log('📋 Gateway - Get Assessments');
    console.log('User from middleware:', req.user);
    
    // Double-check user exists (should never fail if middleware works)
    if (!req.user || !req.user.id) {
      console.error('❌ req.user is undefined after auth middleware!');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed - user not set'
      });
    }

    console.log('Forwarding request with user-id:', req.user.id);
    
    const response = await axios.get(`${ASSESSMENT_SERVICE}/assessments`, {
      headers: { 
        'user-id': req.user.id,
        'Content-Type': 'application/json'
      },
      params: req.query
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error in get assessments:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    next(error);
  }
});

// Start an assessment
router.get('/:assessmentId/start', async (req, res, next) => {
  try {
    console.log('▶️ Gateway - Start Assessment');
    console.log('User ID:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const response = await axios.get(
      `${ASSESSMENT_SERVICE}/assessments/${req.params.assessmentId}/start`,
      { 
        headers: { 
          'user-id': req.user.id,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error in start assessment:', error.message);
    next(error);
  }
});

// Submit assessment
router.post('/:assessmentId/submit', async (req, res, next) => {
  try {
    console.log('📤 Gateway - Submit Assessment');
    console.log('User ID:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const response = await axios.post(
      `${ASSESSMENT_SERVICE}/assessments/${req.params.assessmentId}/submit`,
      req.body,
      { 
        headers: { 
          'user-id': req.user.id,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error in submit assessment:', error.message);
    next(error);
  }
});

// Get user's results
router.get('/results', async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const response = await axios.get(`${ASSESSMENT_SERVICE}/results`, {
      headers: { 
        'user-id': req.user.id,
        'Content-Type': 'application/json'
      },
      params: req.query
    });
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get specific result
router.get('/results/:resultId', async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const response = await axios.get(
      `${ASSESSMENT_SERVICE}/results/${req.params.resultId}`,
      { 
        headers: { 
          'user-id': req.user.id,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
