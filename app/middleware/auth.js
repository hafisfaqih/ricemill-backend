const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found',
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

// Middleware to check if user has required role
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: roles,
        current: userRole,
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole(['admin']);

// Middleware to check if user is admin or manager
const requireManagerOrAdmin = requireRole(['admin', 'manager']);

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    req.user = user || null;
    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    req.user = null;
    next();
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'ricemill-api',
      audience: 'ricemill-app',
    }
  );
};

// Generate refresh token (longer expiry)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'ricemill-api',
      audience: 'ricemill-app',
    }
  );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(
    token, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  );
};

// Middleware to extract user info from token without strict verification
// Useful for logging and analytics
const extractUserInfo = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.decode(token); // Decode without verification
      req.tokenInfo = decoded;
    }
  } catch (error) {
    // Silently ignore errors
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManagerOrAdmin,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  extractUserInfo,
};