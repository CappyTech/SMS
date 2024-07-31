// models/subcontractor.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');

const Subcontractors = sequelize.define('Subcontractors', {
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
        allowNull: true,
        unique: true,
    },
    utrNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    deduction: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    vatNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    isGross: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isCIS: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isReverseCharge: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

module.exports = Subcontractors;