// models/quote.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');
const Clients = require('./client');

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
    job_ref: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    clientId: { // Change client to clientId
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Clients,
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    contact_ref: {
        type: DataTypes.STRING,
        allowNull: true
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
    paranoid: true,
});

module.exports = Quotes;