// models/associations/submissionInvoices.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');
const Submission = require('../submission'); // Assuming the file path is correct
const Invoice = require('../invoice'); // Assuming the file path is correct

class SubmissionInvoices extends Model { }

SubmissionInvoices.init({
    submissionId: {
        type: DataTypes.UUID,
        references: {
            model: Submission,
            key: 'id',
        },
    },
    invoiceId: {
        type: DataTypes.UUID,
        references: {
            model: Invoice,
            key: 'id',
        },
    },
}, {
    sequelize: sequelize, // Assuming you have a reference to the Sequelize instance named 'sequelize'
});

module.exports = SubmissionInvoices;