// models/attendance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');

const Attendances = sequelize.define('Attendances', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  holidays_taken: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  days_without_work: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
    paranoid: false,
});

module.exports = Attendances;
