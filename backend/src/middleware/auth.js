const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// Verify JWT token middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      where: { id: decoded.userId, isActive: true },
      include: [{ model: Role }]
    });
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Check if user has required permission
const authorize = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Admin has all permissions
      if (req.user.Role?.name === 'admin') {
        return next();
      }
      
      // Check if role has the required permission
      if (req.user.Role?.hasPermission(permission)) {
        return next();
      }
      
      res.status(403).json({ error: 'Insufficient permissions' });
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Check if user has one of the required roles
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userRole = req.user.Role?.name;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (allowedRoles.includes(userRole)) {
        return next();
      }
      
      res.status(403).json({ error: 'Insufficient role privileges' });
    } catch (error) {
      res.status(500).json({ error: 'Role check failed' });
    }
  };
};

// Optionally authenticate - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        where: { id: decoded.userId, isActive: true },
        include: [{ model: Role }]
      });
      
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // Silent fail - user remains unauthenticated
  }
  
  next();
};

module.exports = {
  generateToken,
  generateRefreshToken,
  authenticate,
  authorize,
  requireRole,
  optionalAuth
};