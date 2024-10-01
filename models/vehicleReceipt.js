// models/vehicleReceipts.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js'); // Import your Sequelize instance

const VehicleReceipts = sequelize.define('VehicleReceipts', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4, // Automatically generate UUID
  },
  vehicleId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: {
      model: 'Vehicles',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fuelType: {
    type: DataTypes.ENUM('Petrol', 'Diesel'),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  pricePerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
    validate: {
      min: 0,
    },
  },
  supplier: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'vehicleReceipts',
  underscored: true,
  charset: 'latin1',
  collate: 'latin1_bin',
});

module.exports = VehicleReceipts
