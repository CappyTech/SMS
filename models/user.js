// models/user.js

const {
    DataTypes
} = require('sequelize');
const sequelize = require('../db.js');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('subcontractor', 'employee', 'accountant', 'hmrc', 'admin'),
        defaultValue: 'subcontractor',
    },
    permissionCreateUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionReadUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionUpdateUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionDeleteUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionCreateSubcontractor: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionReadSubcontractor: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionUpdateSubcontractor: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionDeleteSubcontractor: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionCreateInvoice: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionReadInvoice: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionUpdateInvoice: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    permissionDeleteInvoice: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    paranoid: true, // Add the paranoid option
});

// Hook to hash the password before saving
User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
});

module.exports = User;