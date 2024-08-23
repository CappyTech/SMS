// models/attendance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');
const Locations = require('./location');

const Attendances = sequelize.define('Attendances', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    locationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Locations,
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    holidays_taken: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    days_without_work: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
}, {
    paranoid: false,
});

module.exports = Attendances;
