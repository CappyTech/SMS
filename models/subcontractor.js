// models/subcontractor.js

const {
    DataTypes
} = require('sequelize');
const sequelize = require('../db');

const Subcontractors = sequelize.define('Subcontractor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: false,
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
    deduction: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.3,
    },
}, {
    paranoid: true,
});

module.exports = Subcontractors;