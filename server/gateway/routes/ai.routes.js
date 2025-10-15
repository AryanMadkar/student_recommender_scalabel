const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

const AI_SERVICE = process.env.AI_SERVICE_URL;

// Apply auth middleware to all routes
router.use(authMiddleware);

// ============================================
// STREAM RECOMMENDATIONS (After 10th)
// ============================================

router.post('/streams/recommendations', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE}/streams/recommendations`,
      req.body,
      { headers: { 'user-id': req.user.id } }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================
// CAREER RECOMMENDATIONS
// ============================================

// Get personalized career recommendations
router.post('/careers/recommendations', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE}/careers/recommendations`,
      req.body,
      { headers: { 'user-id': req.user.id } }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Browse all careers
router.get('/careers', async (req, res, next) => {
  try {
    const response = await axios.get(`${AI_SERVICE}/careers`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get career details
router.get('/careers/:careerId', async (req, res, next) => {
  try {
    const response = await axios.get(`${AI_SERVICE}/careers/${req.params.careerId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Compare careers
router.post('/careers/compare', async (req, res, next) => {
  try {
    const response = await axios.post(`${AI_SERVICE}/careers/compare`, req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================
// COLLEGE RECOMMENDATIONS
// ============================================

// Get personalized college recommendations
router.post('/colleges/recommendations', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE}/colleges/recommendations`,
      req.body,
      { headers: { 'user-id': req.user.id } }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Search colleges with filters
router.get('/colleges/search', async (req, res, next) => {
  try {
    const response = await axios.get(`${AI_SERVICE}/colleges/search`, {
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get colleges by city
router.get('/colleges/city/:city', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${AI_SERVICE}/colleges/city/${req.params.city}`,
      { params: req.query }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get college details
router.get('/colleges/:collegeId', async (req, res, next) => {
  try {
    const response = await axios.get(`${AI_SERVICE}/colleges/${req.params.collegeId}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Compare colleges
router.post('/colleges/compare', async (req, res, next) => {
  try {
    const response = await axios.post(`${AI_SERVICE}/colleges/compare`, req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ============================================
// AI RECOMMENDATIONS (General)
// ============================================

// Generate comprehensive recommendations
router.post('/ai/recommendations', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE}/ai/recommendations`,
      req.body,
      { headers: { 'user-id': req.user.id } }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get recommendation history
router.get('/ai/history', async (req, res, next) => {
  try {
    const response = await axios.get(`${AI_SERVICE}/ai/history`, {
      headers: { 'user-id': req.user.id }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Provide feedback on recommendation
router.post('/ai/recommendations/:recommendationId/feedback', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE}/ai/recommendations/${req.params.recommendationId}/feedback`,
      req.body,
      { headers: { 'user-id': req.user.id } }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
