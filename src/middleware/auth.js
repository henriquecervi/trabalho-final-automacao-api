const jwt = require('jsonwebtoken');

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'UNAUTHORIZED'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-here';
    
    jwt.verify(token, jwtSecret, (error, user) => {
      if (error) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
          error: 'FORBIDDEN'
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Optional authentication middleware (doesn't block if no token)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-here';
    
    jwt.verify(token, jwtSecret, (error, user) => {
      if (error) {
        req.user = null;
      } else {
        req.user = user;
      }
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
