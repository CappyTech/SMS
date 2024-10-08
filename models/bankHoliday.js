const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../services/databaseService');

const BankHoliday = sequelize.define('BankHoliday', {
    id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    bunting: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    division: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true,
    paranoid: true,
    charset: 'latin1',
    collate: 'latin1_bin',
});

module.exports = BankHoliday;