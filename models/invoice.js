// models/invoice.js

const {
    DataTypes
} = require('sequelize');
const sequelize = require('../db');

const Invoice = sequelize.define('Invoice', {
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
        allowNull: false,
    },
    remittanceDate: {
        type: DataTypes.DATE,
        allowNull: false,
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
        allowNull: false,
    },
    reverseCharge: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
}, {
    paranoid: true, // Add the paranoid option
});

module.exports = Invoice;