// models/employees.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../services/databaseService');

const Employees = sequelize.define('Employees', {
  id: {
    type: DataTypes.CHAR(36), // Match the database column type
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phoneNumber: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contactName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contactNumber: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  position: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  managerId: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  hireDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.0,
  },
}, {
  timestamps: true,
  paranoid: true,
  charset: 'latin1',
  collate: 'latin1_bin',
});

module.exports = Employees;
