const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL;

// Register
router.post('/register', async (req, res, next) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE}/register`, req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE}/login`, req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE}/forgot-password`, req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE}/reset-password`, req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get current user (protected)
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // Forward the Authorization header to the auth service
    const token = req.header('Authorization');

    const response = await axios.get(`${AUTH_SERVICE}/me`, {
      headers: {
        'Authorization': token,
        'user-id': req.user.id
      }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});
router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    const response = await axios.put(`${AUTH_SERVICE}/me`, req.body, {
      headers: {
        'Authorization': token,
        'user-id': req.user.id
      }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Validate token (protected)
router.get('/validate', authMiddleware, async (req, res, next) => {
  try {
    const token = req.header('Authorization');

    const response = await axios.get(`${AUTH_SERVICE}/validate`, {
      headers: {
        'Authorization': token,
        'user-id': req.user.id
      }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Logout (protected)
router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const token = req.header('Authorization');

    const response = await axios.post(`${AUTH_SERVICE}/logout`, {}, {
      headers: {
        'Authorization': token,
        'user-id': req.user.id
      }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
