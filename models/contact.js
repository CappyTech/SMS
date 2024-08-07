// models/contact.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');
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
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
    paranoid: false,
});

module.exports = Contacts;
