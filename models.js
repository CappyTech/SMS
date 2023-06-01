// models.js

const {
    DataTypes
} = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('./db');

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
        type: DataTypes.ENUM('subcontractor', 'employee', 'accountant', 'hmrc'),
        defaultValue: 'subcontractor',
    },
});

const Subcontractor = sequelize.define('Subcontractor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
});

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    cisNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    utrNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    kashflowNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    invoiceDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    remittanceDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    grossAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    labourCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    materialCost: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    cisAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    netAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    submissionDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    reverseChargeAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
});

// Associations
User.hasOne(Subcontractor);
Subcontractor.belongsTo(User);

Subcontractor.hasMany(Invoice);
Invoice.belongsTo(Subcontractor);

// Hook to hash the password before saving
User.beforeCreate(async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
});

module.exports = {
    User,
    Subcontractor,
    Invoice
};