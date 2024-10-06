// models/invoice.js
const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../services/databaseService');

const Invoices = sequelize.define('Invoices', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    kashflowNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    invoiceDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    remittanceDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    grossAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    labourCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    materialCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    cisAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    netAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    submissionDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    reverseCharge: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 12
        }
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cisRate: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    cisAmountZero: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    cisAmountTwo: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    cisAmountThree: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
}, {
    paranoid: true,
    timestamp:true,
});

module.exports = Invoices;