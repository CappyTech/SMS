// models/attendance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');
const Locations = require('./location');
const Employees = require('./employee');
const Subcontractors = require('./subcontractor');

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
    type: {
        type: DataTypes.ENUM('off', 'holiday', 'sick', 'work'),
        defaultValue: 'off',
        allowNull: false,
    },
    locationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: Locations,
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    employeeId: {
        type: DataTypes.UUID,
        allowNull: true, // Make it nullable so it can be either employee or subcontractor
        references: {
            model: Employees,
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    subcontractorId: {
        type: DataTypes.UUID,
        allowNull: true, // Make it nullable so it can be either employee or subcontractor
        references: {
            model: Subcontractors,
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    hoursWorked: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
}, {
    paranoid: false,
});

module.exports = Attendances;
