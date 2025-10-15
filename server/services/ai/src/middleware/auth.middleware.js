/**
 * Microservice Authentication Middleware
 * Extracts user-id from header (sent by Gateway)
 * Does NOT verify JWT - Gateway already did that
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get user ID from header (sent by Gateway after JWT verification)
    const userId = req.header('user-id') || req.header('x-user-id');

    if (!userId) {
      console.log('❌ No user-id header found');
      console.log('Headers received:', req.headers);
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. No user ID provided.'
      });
    }

    // Attach user to request object
    req.user = { id: userId };

    console.log('✅ Microservice Auth - User ID set:', userId);
    next();

  } catch (error) {
    console.error('❌ Microservice Auth Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
