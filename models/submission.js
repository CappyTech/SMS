// models/submission.js

const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');

const Submission = sequelize.define('Submission', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    grossTotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    labourTotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    materialTotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    cisTotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    netTotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 12
        }
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
});

module.exports = Submission;
