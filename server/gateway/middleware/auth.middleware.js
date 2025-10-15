const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Log for debugging
    console.log('🔐 Gateway Auth Middleware - Checking token...');
    console.log('Authorization Header:', req.header('Authorization'));

    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Remove 'Bearer ' prefix
    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Invalid token format');
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Invalid token format.' 
      });
    }

    // Verify JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Token decoded but no userId found');
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    // Attach user to request
    req.user = { id: decoded.userId };
    console.log('✅ Gateway Auth - User authenticated:', req.user.id);
    
    next();

  } catch (error) {
    console.error('❌ Gateway Auth Error:', error.message);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }

    // Generic error
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed.',
      error: error.message 
    });
  }
};

module.exports = authMiddleware;
