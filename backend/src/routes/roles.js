const express = require('express');
const { body, validationResult } = require('express-validator');
const { Role, User, AuditLog } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/roles - Get all roles
router.get('/', authenticate, async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['priority', 'DESC']]
    });
    
    // Get user count for each role
    const rolesWithCount = await Promise.all(roles.map(async (role) => {
      const userCount = await User.count({ where: { roleId: role.id } });
      return {
        ...role.toJSON(),
        userCount
      };
    }));
    
    res.json({ roles: rolesWithCount });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/roles/:id - Get specific role
router.get('/:id', authenticate, async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Get users with this role
    const users = await User.findAll({
      where: { roleId: role.id },
      attributes: ['id', 'name', 'email']
    });
    
    res.json({ 
      role,
      users
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// POST /api/roles - Create new role (admin only)
router.post('/', [
  authenticate,
  requireRole('admin'),
  body('name').notEmpty().trim().matches(/^[a-z_]+$/),
  body('displayName').notEmpty().trim(),
  body('permissions').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, displayName, description, permissions, priority } = req.body;
    
    // Check if role exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ error: 'Role already exists' });
    }
    
    // Create role
    const role = await Role.create({
      name,
      displayName,
      description,
      permissions,
      priority: priority || 10,
      isSystem: false
    });
    
    // Log creation
    await AuditLog.log(req.user.id, 'CREATE', 'role', role.id, req.body, req);
    
    res.status(201).json({ 
      message: 'Role created successfully',
      role 
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /api/roles/:id - Update role (admin only)
router.put('/:id', [
  authenticate,
  requireRole('admin'),
  body('displayName').optional().notEmpty().trim(),
  body('permissions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Prevent modification of system roles
    if (role.isSystem) {
      return res.status(400).json({ error: 'Cannot modify system roles' });
    }
    
    // Store old values for audit
    const oldValues = role.toJSON();
    
    // Update role
    const updates = {};
    ['displayName', 'description', 'permissions', 'priority'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    await role.update(updates);
    
    // Log update
    await AuditLog.log(req.user.id, 'UPDATE', 'role', role.id, {
      before: oldValues,
      after: updates
    }, req);
    
    res.json({ 
      message: 'Role updated successfully',
      role 
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/roles/:id - Delete role (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Prevent deletion of system roles
    if (role.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system roles' });
    }
    
    // Check if any users have this role
    const userCount = await User.count({ where: { roleId: role.id } });
    if (userCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete role with ${userCount} assigned users` 
      });
    }
    
    // Log deletion
    await AuditLog.log(req.user.id, 'DELETE', 'role', role.id, {}, req);
    
    // Delete role
    await role.destroy();
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// POST /api/roles/:id/permissions - Add permission to role
router.post('/:id/permissions', [
  authenticate,
  requireRole('admin'),
  body('permission').notEmpty().trim()
], async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    await role.addPermission(req.body.permission);
    
    // Log permission addition
    await AuditLog.log(req.user.id, 'UPDATE', 'role', role.id, {
      action: 'add_permission',
      permission: req.body.permission
    }, req);
    
    res.json({ 
      message: 'Permission added successfully',
      permissions: role.permissions 
    });
  } catch (error) {
    console.error('Error adding permission:', error);
    res.status(500).json({ error: 'Failed to add permission' });
  }
});

// DELETE /api/roles/:id/permissions/:permission - Remove permission from role
router.delete('/:id/permissions/:permission', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    await role.removePermission(req.params.permission);
    
    // Log permission removal
    await AuditLog.log(req.user.id, 'UPDATE', 'role', role.id, {
      action: 'remove_permission',
      permission: req.params.permission
    }, req);
    
    res.json({ 
      message: 'Permission removed successfully',
      permissions: role.permissions 
    });
  } catch (error) {
    console.error('Error removing permission:', error);
    res.status(500).json({ error: 'Failed to remove permission' });
  }
});

module.exports = router;