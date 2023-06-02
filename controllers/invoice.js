// controllers/invoice.js

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
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
const submitInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
            kashflowNumber,
            invoiceDate,
            remittanceDate,
            labourCost,
            materialCost,
            submissionDate,
            reverseCharge,
        } = req.body;
        console.log(req.body);
        let cisAmount = 0;
        let grossAmount = 0;
        let netAmount = 0;
        const subcontractor = await Subcontractor.findByPk(req.params.selected);
        if (subcontractor) {
            const {
                isGross
            } = subcontractor;
            cisAmount = isGross ? 0 : labourCost * 0.2;
            const grossAmount = 0;
            const netAmount = labourCost + materialCost + cisAmount;

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
                reverseCharge,
            });
        }
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
    submitInvoice,
    getAllInvoices,
};