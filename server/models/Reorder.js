const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reorder = sequelize.define('Reorder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reorderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  originalOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  installationType: {
    type: DataTypes.ENUM('INSTALLATION', 'REMOVAL', 'REPAIR'),
    allowNull: false
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  additionalInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  listingAgentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'PENDING'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  hooks: {
    beforeCreate: async (reorder) => {
      if (!reorder.reorderId) {
        const timestamp = Date.now();
        reorder.reorderId = `RO-${timestamp}`;
      }
    }
  }
});

module.exports = Reorder;