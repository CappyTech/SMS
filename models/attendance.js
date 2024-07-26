// models/Attendance.js

const {
    DataTypes
} = require('sequelize');
const sequelize = require('../db.js');

const Attendance = sequelize.define('Attendance', {
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
    paranoid: true,
});

module.exports = Attendance;
