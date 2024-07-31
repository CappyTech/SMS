// models/client.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');

const Clients = sequelize.define('Clients', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    paranoid: false,
});

module.exports = Clients;
