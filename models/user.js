// models/user.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db.js');
const bcrypt = require('bcrypt');
const helpers = require('../helpers');

// Define the Users model
const Users = sequelize.define('Users', {
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
        allowNull: false,
    },
    // Permissions for roles
    permissionCreateUser: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionReadUser: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionUpdateUser: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionDeleteUser: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionCreateSubcontractor: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionReadSubcontractor: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionUpdateSubcontractor: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionDeleteSubcontractor: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionCreateInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionReadInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionUpdateInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
    permissionDeleteInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
    // TOTP fields
    totpSecret: {
        type: DataTypes.STRING,
        allowNull: true, // Can be null until TOTP is enabled
        set(value) {
            if (value) {
                this.setDataValue('totpSecret', helpers.encrypt(value)); // Encrypt secret before storing
            }
        },
        get() {
            const encrypted = this.getDataValue('totpSecret');
            return encrypted ? helpers.decrypt(encrypted) : null; // Decrypt when retrieving
        }
    },
    totpEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    paranoid: false, // Set to true if you want soft deletes (deletedAt)
});

// Hook to hash the password before creating the user
Users.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

// Hook to hash the password before updating the user, if the password is being changed
Users.beforeUpdate(async (user) => {
    if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

module.exports = Users;