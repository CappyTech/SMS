const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');

const BankHoliday = sequelize.define('BankHoliday', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
    tableName: 'bank_holidays',
    timestamps: false,
});

module.exports = BankHoliday;