const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User, Role, AuditLog } = require('../models');
const { generateToken, generateRefreshToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().trim(),
  body('role').optional().isIn(['technician', 'client']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password, name, department, role: roleName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Get role (default to technician for self-registration)
    const role = await Role.findOne({ 
      where: { name: roleName || 'technician' } 
    });
    
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      name,
      department: department || 'AV Team',
      roleId: role.id
    });
    
    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Log registration
    await AuditLog.log(user.id, 'REGISTER', 'user', user.id, { email }, req);
    
    // Return user with tokens
    const userData = await User.findByPk(user.id, {
      include: [{ model: Role }]
    });
    
    res.status(201).json({
      message: 'Registration successful',
      user: userData,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with role
    const user = await User.findOne({
      where: { email, isActive: true },
      include: [{ model: Role }]
    });
    
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // Update user login info
    user.refreshToken = refreshToken;
    await user.updateLoginInfo();
    
    // Log login
    await AuditLog.log(user.id, 'LOGIN', 'user', user.id, {}, req);
    
    res.json({
      message: 'Login successful',
      user,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Find user
    const user = await User.findOne({
      where: { 
        id: decoded.userId, 
        refreshToken,
        isActive: true 
      },
      include: [{ model: Role }]
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    
    // Save new refresh token
    user.refreshToken = newRefreshToken;
    await user.save();
    
    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Clear refresh token
    req.user.refreshToken = null;
    await req.user.save();
    
    // Log logout
    await AuditLog.log(req.user.id, 'LOGOUT', 'user', req.user.id, {}, req);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/password
router.put('/password', [
  authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    if (!(await req.user.validatePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    req.user.password = newPassword;
    await req.user.save();
    
    // Log password change
    await AuditLog.log(req.user.id, 'PASSWORD_CHANGE', 'user', req.user.id, {}, req);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password update failed' });
  }
});

module.exports = router;