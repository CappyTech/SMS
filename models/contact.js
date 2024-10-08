// models/contact.js
const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../services/databaseService');

const Clients = require('./client');

const Contacts = sequelize.define('Contacts', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Clients,
            key: 'id',
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
    paranoid: true,
    charset: 'latin1',
    collate: 'latin1_bin',
});

module.exports = Contacts;
