const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  officeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Offices',
      key: 'id'
    }
  },
  agentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  installationType: {
    type: DataTypes.ENUM('INSTALLATION', 'REMOVAL', 'REPAIR'),
    allowNull: false
  },
  propertyType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Address fields
  streetAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Contact information
  contactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  // Dates
  listingDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  installationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Additional information
  directions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  additionalInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Special features
  underwaterSprinkler: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  invisibleDogFence: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Vendor information
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Vendors',
      key: 'id'
    }
  },
  // Status
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
    beforeCreate: async (order) => {
      if (!order.orderId) {
        const timestamp = Date.now();
        order.orderId = `SO-${timestamp}`;
      }
    }
  }
});

module.exports = Order;