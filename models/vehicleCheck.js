// models/vehicleChecks.js
const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../services/databaseService');

const VehicleChecks = sequelize.define('VehicleChecks', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: sequelize.DataTypes.UUIDV4,
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
    defaultValue: sequelize.DataTypes.NOW,
  },
  typeOfCheck: {
    type: DataTypes.ENUM('Daily', 'Weekly', 'Monthly', 'Pre-Trip', 'Post-Trip', 'Safety'),
    allowNull: false,
  },
  checkStatus: {
    type: DataTypes.ENUM('Passed', 'Failed', 'Needs Attention', 'Pending'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  inspectorName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'vehicleChecks',
  underscored: true,
  charset: 'latin1',
  collate: 'latin1_bin',
});

module.exports = VehicleChecks;