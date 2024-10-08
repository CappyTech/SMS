// models/client.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../services/databaseService');

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
    timestamps: true,
    paranoid: true,
    charset: 'latin1',
    collate: 'latin1_bin',
});

module.exports = Clients;
