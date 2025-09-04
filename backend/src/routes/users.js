const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Role, AuditLog } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Get all users
router.get('/', authenticate, authorize('users.read'), async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get specific user
router.get('/:id', authenticate, authorize('users.read'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Role }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', [
  authenticate,
  authorize('users.create'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('roleId').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, name, roleId, department } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      name,
      roleId,
      department: department || 'AV Team'
    });
    
    // Log creation
    await AuditLog.log(req.user.id, 'CREATE', 'user', user.id, req.body, req);
    
    // Fetch with role
    const newUser = await User.findByPk(user.id, {
      include: [{ model: Role }]
    });
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: newUser 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', [
  authenticate,
  authorize('users.update'),
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().notEmpty().trim(),
  body('roleId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Store old values for audit
    const oldValues = user.toJSON();
    
    // Update allowed fields
    const updates = {};
    ['email', 'name', 'department', 'roleId', 'isActive'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    // If email is being changed, check it's unique
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: updates.email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // If role is being changed, verify it exists
    if (updates.roleId) {
      const role = await Role.findByPk(updates.roleId);
      if (!role) {
        return res.status(400).json({ error: 'Invalid role' });
      }
    }
    
    // Update user
    await user.update(updates);
    
    // Log update
    await AuditLog.log(req.user.id, 'UPDATE', 'user', user.id, {
      before: oldValues,
      after: updates
    }, req);
    
    // Fetch updated user with role
    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: Role }]
    });
    
    res.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user (soft delete)
router.delete('/:id', authenticate, authorize('users.delete'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Soft delete by deactivating
    user.isActive = false;
    await user.save();
    
    // Log deletion
    await AuditLog.log(req.user.id, 'DELETE', 'user', user.id, {}, req);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PUT /api/users/:id/preferences - Update user preferences
router.put('/:id/preferences', authenticate, async (req, res) => {
  try {
    // Users can only update their own preferences
    if (req.params.id !== req.user.id && req.user.Role?.name !== 'admin') {
      return res.status(403).json({ error: 'Cannot update other user preferences' });
    }
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update preferences
    user.preferences = {
      ...user.preferences,
      ...req.body
    };
    await user.save();
    
    res.json({ 
      message: 'Preferences updated successfully',
      preferences: user.preferences 
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;