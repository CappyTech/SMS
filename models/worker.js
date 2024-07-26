const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');

const Worker = sequelize.define('Worker', {
  id: {
    type: DataTypes.UUID,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Add other fields as necessary
}, {
  paranoid: true,
});

module.exports = Worker;
