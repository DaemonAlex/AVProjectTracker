const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g., CREATE, UPDATE, DELETE, LOGIN, LOGOUT'
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g., project, user, task'
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  changes: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'What was changed (before/after values)'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional context like IP address, user agent'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false, // Audit logs should not be updated
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Class methods
AuditLog.log = async function(userId, action, entityType, entityId, changes = {}, req = null) {
  const metadata = {};
  const ipAddress = req ? (req.ip || req.connection?.remoteAddress) : null;
  const userAgent = req ? req.get('user-agent') : null;
  
  if (req) {
    metadata.method = req.method;
    metadata.path = req.path;
  }
  
  return await AuditLog.create({
    userId,
    action,
    entityType,
    entityId,
    changes,
    metadata,
    ipAddress,
    userAgent
  });
};

// Instance methods
AuditLog.prototype.getFormattedAction = function() {
  const actionMap = {
    CREATE: 'created',
    UPDATE: 'updated',
    DELETE: 'deleted',
    LOGIN: 'logged in',
    LOGOUT: 'logged out',
    EXPORT: 'exported',
    IMPORT: 'imported'
  };
  
  return actionMap[this.action] || this.action.toLowerCase();
};

AuditLog.prototype.getSummary = async function() {
  const User = require('./User');
  const user = await User.findByPk(this.userId);
  
  return `${user?.name || 'Unknown user'} ${this.getFormattedAction()} ${this.entityType} ${this.entityId || ''}`;
};

module.exports = AuditLog;