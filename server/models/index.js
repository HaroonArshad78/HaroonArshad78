const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Office = require('./Office');
const Order = require('./Order');
const Vendor = require('./Vendor');
const Reorder = require('./Reorder');
const CCEmail = require('./CCEmail');

// Define associations

// User-Office relationship
User.belongsTo(Office, { foreignKey: 'officeId', as: 'office' });
Office.hasMany(User, { foreignKey: 'officeId', as: 'users' });

// Order relationships
Order.belongsTo(Office, { foreignKey: 'officeId', as: 'office' });
Order.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });
Order.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });

Office.hasMany(Order, { foreignKey: 'officeId', as: 'orders' });
User.hasMany(Order, { foreignKey: 'agentId', as: 'orders' });
Vendor.hasMany(Order, { foreignKey: 'vendorId', as: 'orders' });

// Reorder relationships
Reorder.belongsTo(Order, { foreignKey: 'originalOrderId', as: 'originalOrder' });
Reorder.belongsTo(User, { foreignKey: 'listingAgentId', as: 'listingAgent' });

Order.hasMany(Reorder, { foreignKey: 'originalOrderId', as: 'reorders' });
User.hasMany(Reorder, { foreignKey: 'listingAgentId', as: 'reorders' });

// CCEmail relationships
CCEmail.belongsTo(Office, { foreignKey: 'officeId', as: 'office' });
CCEmail.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });
CCEmail.belongsTo(User, { foreignKey: 'enteredBy', as: 'enteredByUser' });
CCEmail.belongsTo(User, { foreignKey: 'modifiedBy', as: 'modifiedByUser' });

Office.hasMany(CCEmail, { foreignKey: 'officeId', as: 'ccEmails' });
User.hasMany(CCEmail, { foreignKey: 'agentId', as: 'ccEmails' });

module.exports = {
  sequelize,
  User,
  Office,
  Order,
  Vendor,
  Reorder,
  CCEmail
};