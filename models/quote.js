// models/quote.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../services/databaseService');

const Clients = require('./client');
const Contacts = require('./contact');
const Locations = require('./location');

const Quotes = sequelize.define('Quotes', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    quote_ref: {
        type: DataTypes.STRING,
        allowNull: true
    },
    locationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Locations,
            key: 'id',
        }
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Clients,
            key: 'id',
        }
    },
    contactId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: Contacts,
            key: 'id',
        }
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    desc: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    invoice_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    invoice_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isAccepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
    },
    updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    timestamps: true,
    paranoid: true,
    charset: 'latin1',
    collate: 'latin1_bin',
});

module.exports = Quotes;
