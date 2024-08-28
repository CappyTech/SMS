const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Drive = sequelize.define('Drive', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    itemId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,  // Ensuring itemId is unique across all entries
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    size: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    mimeType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fileType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    createdDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    lastModifiedDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    parentPath: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    downloadUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = Drive;
