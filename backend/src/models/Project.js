const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  client: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('new-build', 'renovation', 'maintenance', 'other'),
    defaultValue: 'new-build'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'on-hold', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estimatedBudget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  actualBudget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  tasks: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  teamMembers: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of user IDs assigned to this project'
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional project-specific data'
  }
}, {
  timestamps: true,
  paranoid: true, // Soft deletes
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['ownerId']
    },
    {
      fields: ['client']
    }
  ]
});

// Instance methods
Project.prototype.calculateProgress = function() {
  if (!this.tasks || this.tasks.length === 0) return 0;
  
  // Only count main tasks (not subtasks) for overall progress
  const mainTasks = this.tasks.filter(task => !task.parentId);
  if (mainTasks.length === 0) return 0;
  
  let totalWeight = 0;
  let completedWeight = 0;
  
  mainTasks.forEach(task => {
    const subtasks = this.tasks.filter(st => st.parentId === task.id);
    
    if (subtasks.length === 0) {
      // Simple task without subtasks
      totalWeight += 1;
      if (task.status === 'completed') {
        completedWeight += 1;
      } else if (task.status === 'in-progress') {
        completedWeight += 0.5;
      }
    } else {
      // Task with subtasks - calculate based on subtask completion
      const completedSubtasks = subtasks.filter(st => st.status === 'completed').length;
      const subtaskProgress = completedSubtasks / subtasks.length;
      
      totalWeight += 1;
      completedWeight += subtaskProgress;
    }
  });
  
  return Math.round((completedWeight / totalWeight) * 100);
};

Project.prototype.isOverdue = function() {
  return new Date() > new Date(this.endDate) && this.status !== 'completed';
};

Project.prototype.getDaysRemaining = function() {
  const today = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

Project.prototype.addTask = function(task) {
  const newTask = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    position: task.position || this.tasks.length,
    status: task.status || 'not-started',
    priority: task.priority || 'medium',
    ...task,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Validate parent task exists if this is a subtask
  if (newTask.parentId) {
    const parentExists = this.tasks.some(t => t.id === newTask.parentId);
    if (!parentExists) {
      throw new Error('Parent task not found');
    }
  }
  
  this.tasks = [...this.tasks, newTask];
  this.progress = this.calculateProgress();
  
  // Auto-update parent task status if adding subtask
  if (newTask.parentId) {
    this.updateParentTaskStatus(newTask.parentId);
  }
  
  return newTask;
};

Project.prototype.updateTask = function(taskId, updates) {
  const oldTask = this.tasks.find(task => task.id === taskId);
  if (!oldTask) return;
  
  this.tasks = this.tasks.map(task => 
    task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
  );
  
  // Update parent task status if this is a subtask and status changed
  if (oldTask.parentId && updates.status && updates.status !== oldTask.status) {
    this.updateParentTaskStatus(oldTask.parentId);
  }
  
  this.progress = this.calculateProgress();
};

Project.prototype.deleteTask = function(taskId) {
  const task = this.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  // Delete task and all its subtasks
  this.tasks = this.tasks.filter(t => t.id !== taskId && t.parentId !== taskId);
  
  // Update parent task status if this was a subtask
  if (task.parentId) {
    this.updateParentTaskStatus(task.parentId);
  }
  
  this.progress = this.calculateProgress();
};

Project.prototype.updateParentTaskStatus = function(parentId) {
  if (!parentId) return;
  
  const parentTask = this.tasks.find(t => t.id === parentId);
  const subtasks = this.tasks.filter(t => t.parentId === parentId);
  
  if (parentTask && subtasks.length > 0) {
    const allCompleted = subtasks.every(st => st.status === 'completed');
    const anyInProgress = subtasks.some(st => st.status === 'in-progress');
    const anyStarted = subtasks.some(st => st.status !== 'not-started');
    
    if (allCompleted) {
      parentTask.status = 'completed';
    } else if (anyInProgress || anyStarted) {
      parentTask.status = 'in-progress';
    } else {
      parentTask.status = 'not-started';
    }
    
    parentTask.updatedAt = new Date().toISOString();
  }
};

Project.prototype.canUserAccess = function(user, permission) {
  // Admin can access everything
  if (user.Role && user.Role.name === 'admin') return true;
  
  // Owner has full access
  if (this.ownerId === user.id) return true;
  
  // Check if user is a team member
  if (this.teamMembers.includes(user.id)) {
    // Check specific permission based on role
    if (user.Role && user.Role.hasPermission(permission)) {
      return true;
    }
  }
  
  // Client access to their own projects
  if (user.Role && user.Role.name === 'client' && this.metadata.clientUserId === user.id) {
    return permission.includes('read');
  }
  
  return false;
};

module.exports = Project;