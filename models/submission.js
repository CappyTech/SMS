// models/submissions.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Invoice = require('./invoice'); // Assuming the file path is correct

const Submissions = sequelize.define('Submission', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
        allowNull: false,
    },
}, {});

Submissions.associate = (models) => {
    Submissions.belongsToMany(Invoice, {
        through: 'SubmissionInvoices',
        foreignKey: 'submissionId',
        otherKey: 'invoiceId',
    });
};

module.exports = Submissions;