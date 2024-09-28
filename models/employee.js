// models/employees.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');

const Employees = sequelize.define('Employees', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contactName: {
    type: DataTypes.STRING, // Store the emergency contact's name separately
    allowNull: true,
  },
  contactNumber: {
    type: DataTypes.STRING, // Store the emergency contact's phone number separately
    allowNull: true,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // e.g., 'full-time', 'part-time'
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // e.g., 'active', 'on leave', 'terminated'
    allowNull: false,
  },
  managerId: {
    type: DataTypes.UUID, // Self-referencing foreign key to Employees
    allowNull: true,
  },
  hireDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  paranoid: false,
  timestamps: true,
});

module.exports = Employees;
