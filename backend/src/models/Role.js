const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('permissions');
      return rawValue || [];
    }
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Higher number = higher priority'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System roles cannot be deleted'
  }
}, {
  timestamps: true
});

// Default permissions structure
const DEFAULT_PERMISSIONS = {
  admin: [
    'users.create', 'users.read', 'users.update', 'users.delete',
    'projects.create', 'projects.read', 'projects.update', 'projects.delete',
    'reports.executive', 'reports.portfolio', 'reports.resource', 'reports.risk',
    'settings.manage', 'roles.manage', 'audit.view'
  ],
  project_manager: [
    'projects.create', 'projects.read', 'projects.update', 'projects.delete',
    'reports.executive', 'reports.portfolio', 'reports.resource', 'reports.risk',
    'users.read', 'audit.view'
  ],
  team_lead: [
    'projects.read', 'projects.update',
    'reports.portfolio', 'reports.risk', 'reports.project',
    'users.read'
  ],
  technician: [
    'projects.read', 'projects.update.tasks',
    'reports.project'
  ],
  client: [
    'projects.read.own',
    'reports.project.own'
  ]
};

// Class methods
Role.createDefaultRoles = async function() {
  const roles = [
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: DEFAULT_PERMISSIONS.admin,
      priority: 100,
      isSystem: true
    },
    {
      name: 'project_manager',
      displayName: 'Project Manager',
      description: 'Can manage all projects and view all reports',
      permissions: DEFAULT_PERMISSIONS.project_manager,
      priority: 80,
      isSystem: true
    },
    {
      name: 'team_lead',
      displayName: 'Team Lead',
      description: 'Can edit assigned projects and view team reports',
      permissions: DEFAULT_PERMISSIONS.team_lead,
      priority: 60,
      isSystem: true
    },
    {
      name: 'technician',
      displayName: 'Technician',
      description: 'Can update task status and add notes',
      permissions: DEFAULT_PERMISSIONS.technician,
      priority: 40,
      isSystem: true
    },
    {
      name: 'client',
      displayName: 'Client',
      description: 'View-only access to specific projects',
      permissions: DEFAULT_PERMISSIONS.client,
      priority: 20,
      isSystem: true
    }
  ];

  for (const roleData of roles) {
    await Role.findOrCreate({
      where: { name: roleData.name },
      defaults: roleData
    });
  }
};

// Instance methods
Role.prototype.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

Role.prototype.addPermission = async function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions = [...this.permissions, permission];
    await this.save();
  }
};

Role.prototype.removePermission = async function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  await this.save();
};

module.exports = Role;