// models/subcontractor.js

const {
    DataTypes
} = require('sequelize');
const sequelize = require('../db');

const Subcontractor = sequelize.define('Subcontractor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    line1: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    line2: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    county: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    postalCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cisNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    utrNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    onboarded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    onboardedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
}, {
    paranoid: true, // Add the paranoid option
});

module.exports = Subcontractor;