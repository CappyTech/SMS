// controllers/admin.js

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const User = require('../models/user');
const helpers = require('../helpers');
const {
    Op
} = require('sequelize');

const validateInvoiceData = (data) => {
    const {
        invoiceNumber,
        kashflowNumber,
        labourCost,
        materialCost,
        month,
        year
    } = data;

    if (!invoiceNumber || !kashflowNumber || !labourCost || !materialCost || !month || !year) {
        throw new Error('Missing required fields.');
    }

    if (month < 1 || month > 12) {
        throw new Error('Month should be between 1 and 12.');
    }

    const currentYear = new Date().getFullYear();
    const incorporationYear = parseInt(process.env.INCORPORATION_YEAR, 10);
    if (year < incorporationYear || year > currentYear) {
        throw new Error(`Year should be between ${incorporationYear} and ${currentYear}.`);
    }
};

const calculateInvoiceAmounts = (labourCost, materialCost, cisNumber) => {
    let cisRate = 0; // Default rate for VAT Registered companies

    const isRegisteredForCIS = cisNumber && cisNumber.startsWith('V'); // Check if cisNumber starts with 'V'

    // Check conditions for CIS deductions
    if (!isRegisteredForCIS) {
        cisRate = 0.3; // 30% for not verified or not provided correct name
    } else if (isRegisteredForCIS) {
        cisRate = 0.2; // 20% for CIS registered and verified
    }

    const cisAmount = parseFloat(labourCost) * cisRate;
    const grossAmount = parseFloat(labourCost) + parseFloat(materialCost);
    const netAmount = parseFloat(labourCost) - cisAmount + parseFloat(materialCost);
    const reverseCharge = grossAmount * 0.2; // Assuming reverse charge remains 20% of gross

    return {
        cisAmount,
        grossAmount,
        netAmount,
        reverseCharge
    };
};

// TODO: In the future, consider implementing a check for 'providedCorrectName' 
// to further refine the CIS deduction rate.