// controllers/invoice.js

const packageJson = require('../package.json');
const {
    Invoice
} = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');

// Retrieve all subcontractors from the database
const getAllSubcontractors = async () => {
    try {
        const subcontractors = await Subcontractor.findAll();
        return subcontractors;
    } catch (error) {
        throw new Error('Error retrieving subcontractors: ' + error.message);
    }
};

// Display the invoice creation form
const selectSubcontractor = async (req, res) => {
    try {

        const subcontractors = await getAllSubcontractors();

        res.render('selectSubcontractor', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            subcontractors,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Display the invoice creation form
const renderInvoiceForm = async (req, res) => {
    try {
        if (req.params.selected) {
            const subcontractor = await Subcontractor.findByPk(req.params.selected);
            return res.render('createInvoice', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                subcontractor,
            });
        }
        return res.send('Subcontractor not found');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};


// Handle the submission of the invoice creation form
const createInvoice = async (req, res) => {
    try {
        const {
            subcontractorId,
            invoiceNumber,
            kashflowNumber,
            invoiceDate,
            remittanceDate,
            grossAmount,
            labourCost,
            materialCost,
            netAmount,
            submissionDate,
            reverseChargeAmount,
        } = req.body;

        // Calculate the CIS amount based on the gross amount status
        let cisAmount = 0;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);
        if (subcontractor) {
            const {
                isGross
            } = subcontractor;
            cisAmount = isGross ? 0 : labourCost * 0.2;

        }

        // Create a new invoice in the database
        await Invoice.create({
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
            reverseChargeAmount,
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
            invoices,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

module.exports = {
    selectSubcontractor,
    renderInvoiceForm,
    createInvoice,
    getAllInvoices,
};