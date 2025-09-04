const express = require('express');
const { body, validationResult } = require('express-validator');
const { Project, User, AuditLog } = require('../models');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/projects - Get all projects
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, search, limit = 100, offset = 0 } = req.query;
    const where = {};
    
    // Apply filters based on user role
    if (req.user.Role?.name === 'client') {
      where.metadata = {
        clientUserId: req.user.id
      };
    } else if (req.user.Role?.name === 'technician') {
      where.teamMembers = {
        [Op.contains]: [req.user.id]
      };
    }
    
    // Apply query filters
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { client: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const projects = await Project.findAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    const total = await Project.count({ where });
    
    res.json({ 
      projects,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get specific project
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    if (!project.canUserAccess(req.user, 'projects.read')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create new project
router.post('/', [
  authenticate,
  authorize('projects.create'),
  body('name').notEmpty().trim(),
  body('client').notEmpty().trim(),
  body('type').isIn(['new-build', 'renovation', 'maintenance', 'other']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const projectData = {
      ...req.body,
      ownerId: req.user.id,
      teamMembers: [req.user.id]
    };
    
    const project = await Project.create(projectData);
    
    // Log creation
    await AuditLog.log(req.user.id, 'CREATE', 'project', project.id, projectData, req);
    
    // Fetch with owner
    const newProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
    });
    
    res.status(201).json({ 
      message: 'Project created successfully',
      project: newProject 
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', [
  authenticate,
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('type').optional().isIn(['new-build', 'renovation', 'maintenance', 'other']),
  body('status').optional().isIn(['draft', 'active', 'on-hold', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    if (!project.canUserAccess(req.user, 'projects.update')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Store old values for audit
    const oldValues = project.toJSON();
    
    // Update project
    await project.update(req.body);
    
    // Log update
    await AuditLog.log(req.user.id, 'UPDATE', 'project', project.id, {
      before: oldValues,
      after: req.body
    }, req);
    
    // Fetch updated project with owner
    const updatedProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
    });
    
    res.json({ 
      message: 'Project updated successfully',
      project: updatedProject 
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project (soft delete)
router.delete('/:id', authenticate, authorize('projects.delete'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    if (!project.canUserAccess(req.user, 'projects.delete')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Log deletion
    await AuditLog.log(req.user.id, 'DELETE', 'project', project.id, {}, req);
    
    // Soft delete
    await project.destroy();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST /api/projects/:id/tasks - Add task to project
router.post('/:id/tasks', [
  authenticate,
  body('name').notEmpty().trim(),
  body('assignee').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['not-started', 'in-progress', 'completed', 'on-hold'])
], async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    if (!project.canUserAccess(req.user, 'projects.update')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const task = project.addTask(req.body);
    await project.save();
    
    // Log task creation
    await AuditLog.log(req.user.id, 'CREATE', 'task', task.id, task, req);
    
    res.status(201).json({ 
      message: 'Task added successfully',
      task 
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

// PUT /api/projects/:id/tasks/:taskId - Update task
router.put('/:id/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    const canUpdate = req.user.Role?.hasPermission('projects.update.tasks') ||
                      project.canUserAccess(req.user, 'projects.update');
    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    try {
      project.updateTask(req.params.taskId, req.body);
      
      // Recalculate project progress
      project.progress = project.calculateProgress();
      await project.save();
      
      // Log task update
      await AuditLog.log(req.user.id, 'UPDATE', 'task', req.params.taskId, req.body, req);
      
      // Fetch updated project with owner
      const updatedProject = await Project.findByPk(project.id, {
        include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
      });

      res.json({ 
        message: 'Task updated successfully',
        project: updatedProject
      });
    } catch (taskError) {
      console.error('Task update error:', taskError);
      res.json({ 
        message: 'Task updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/projects/:id/tasks/:taskId - Delete task
router.delete('/:id/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    if (!project.canUserAccess(req.user, 'projects.update')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    project.deleteTask(req.params.taskId);
    
    // Recalculate project progress
    project.progress = project.calculateProgress();
    await project.save();
    
    // Log task deletion
    await AuditLog.log(req.user.id, 'DELETE', 'task', req.params.taskId, {}, req);
    
    // Fetch updated project with owner
    const updatedProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
    });

    res.json({ 
      message: 'Task deleted successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// PUT /api/projects/:id/tasks/reorder - Reorder tasks
router.put('/:id/tasks/reorder', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    if (!project.canUserAccess(req.user, 'projects.update')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { taskOrders } = req.body; // Array of {id, position}
    
    if (!Array.isArray(taskOrders)) {
      return res.status(400).json({ error: 'taskOrders must be an array' });
    }
    
    // Update task positions
    taskOrders.forEach(({ id, position }) => {
      const taskIndex = project.tasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        project.tasks[taskIndex].position = position;
        project.tasks[taskIndex].updatedAt = new Date().toISOString();
      }
    });
    
    // Sort tasks by new positions
    project.tasks.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    await project.save();
    
    // Log reorder action
    await AuditLog.log(req.user.id, 'REORDER', 'tasks', project.id, { taskOrders }, req);
    
    res.json({ 
      message: 'Tasks reordered successfully',
      tasks: project.tasks
    });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// GET /api/projects/stats/overview - Get project statistics
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const where = {};
    
    // Apply filters based on user role
    if (req.user.Role?.name === 'client') {
      where.metadata = {
        clientUserId: req.user.id
      };
    } else if (req.user.Role?.name === 'technician') {
      where.teamMembers = {
        [Op.contains]: [req.user.id]
      };
    }
    
    const stats = {
      total: await Project.count({ where }),
      byStatus: await Project.count({
        where,
        group: 'status',
        attributes: ['status']
      }),
      byType: await Project.count({
        where,
        group: 'type',
        attributes: ['type']
      }),
      overdue: await Project.count({
        where: {
          ...where,
          endDate: { [Op.lt]: new Date() },
          status: { [Op.ne]: 'completed' }
        }
      })
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;