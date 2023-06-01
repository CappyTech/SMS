// controllers/invoice.js

const {
    Invoice
} = require('../models/invoice');

// Display the invoice creation form
const renderInvoiceForm = (req, res) => {
    res.render('createInvoice');
};

// Handle the submission of the invoice creation form
const createInvoice = async (req, res) => {
    try {
        const {
            cisNumber,
            utrNumber,
            invoiceNumber,
            kashflowNumber,
            invoiceDate,
            remittanceDate,
            grossAmount,
            labourCost,
            materialCost,
            cisAmount,
            netAmount,
            submissionDate,
            reverseChargeAmount
        } = req.body;

        // Create a new invoice in the database
        await Invoice.create({
            cisNumber,
            utrNumber,
            invoiceNumber,
            kashflowNumber,
            invoiceDate,
            remittanceDate,
            grossAmount,
            labourCost,
            materialCost,
            cisAmount,
            netAmount,
            submissionDate,
            reverseChargeAmount
        });

        res.send('Invoice created successfully');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Fetch all invoices from the database
const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.findAll();
        res.render('invoices', {
            invoices
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

module.exports = {
    renderInvoiceForm,
    createInvoice,
    getAllInvoices
};