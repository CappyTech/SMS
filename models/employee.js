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
  position: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  paranoid: false,
});

module.exports = Employees;
