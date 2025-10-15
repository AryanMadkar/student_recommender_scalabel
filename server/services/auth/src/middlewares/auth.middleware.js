const jwt = require('jsonwebtoken');

/**
 * Auth Service Middleware
 * Handles authentication from both:
 * 1. Gateway (via user-id header)
 * 2. Direct calls (via JWT token)
 */
const authMiddleware = (req, res, next) => {
  try {
    console.log('🔐 Auth Service - Middleware');
    console.log('Headers:', {
      authorization: req.header('Authorization'),
      userId: req.header('user-id')
    });

    // Check if called via Gateway (has user-id header)
    let userId = req.header('user-id');
    
    if (userId) {
      // Called from Gateway - trust the user-id header
      console.log('✅ Auth from Gateway, user-id:', userId);
      req.user = { id: userId };
      return next();
    }

    // Direct call - verify JWT token
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ No auth header and no user-id');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication provided.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.'
      });
    }

    req.user = { id: decoded.userId };
    console.log('✅ Auth from JWT, user-id:', decoded.userId);
    next();

  } catch (error) {
    console.error('❌ Auth Service Middleware Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
