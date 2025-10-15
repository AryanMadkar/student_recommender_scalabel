const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middlewares/auth.middleware'); // ✅ FIXED!

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get current user
router.get('/me', authMiddleware, authController.getCurrentUser);

// Validate token
router.get('/validate', authMiddleware, authController.validateToken);

// Logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
