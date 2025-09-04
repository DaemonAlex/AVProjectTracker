const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Project = require('./Project');
const AuditLog = require('./AuditLog');

// Define associations
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

Project.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(Project, { as: 'ownedProjects', foreignKey: 'ownerId' });

AuditLog.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(AuditLog, { foreignKey: 'userId' });

// Initialize default data
async function initializeDatabase() {
  try {
    // Create default roles
    await Role.createDefaultRoles();
    
    // Create admin user if it doesn't exist
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      
      const [adminUser, created] = await User.findOrCreate({
        where: { email: process.env.ADMIN_EMAIL },
        defaults: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          name: 'System Administrator',
          roleId: adminRole.id,
          department: 'Administration'
        }
      });
      
      if (created) {
        console.log('✅ Admin user created successfully');
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  sequelize,
  User,
  Role,
  Project,
  AuditLog,
  initializeDatabase
};