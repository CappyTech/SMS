const { DataTypes } = require('sequelize');
const { sequelize, Sequelize } = require('../services/databaseService');

const Clients = require('./client');
const Quotes = require('./quote');
const Locations = require('./location');

const Jobs = sequelize.define('Jobs', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    job_ref: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
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
    clientId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: Clients,
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    quoteId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: Quotes,
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'pending',
    },
    desc: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    completionDate: {
        type: DataTypes.DATE,
        allowNull: true,
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
    indexes: [
        // Add a composite index instead of separate indexes for locationId and clientId
        {
            fields: ['locationId', 'clientId'],
        },
    ],
});

module.exports = Jobs;
