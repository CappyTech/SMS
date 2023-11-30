// /controllers/invoiceCRUD.js

const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const {validateInvoiceData,calculateInvoiceAmounts, slimDateTime, formatCurrency} = require('../helpers');
const createInvoice = async (req, res) => {
    try {
        const validatedData = validateInvoiceData(req.body);
        const subcontractor = await Subcontractor.findByPk(req.params.id);
        const amounts = calculateInvoiceAmounts(validatedData.labourCost, validatedData.materialCost, subcontractor.isGross, subcontractor.cisNumber, subcontractor.vatnumber); // Adjust parameters as needed

        // Create invoice record
        const newInvoice = await Invoice.create({
            invoiceNumber: validatedData.invoiceNumber,
            kashflowNumber: validatedData.kashflowNumber,
            invoiceDate: validatedData.invoiceDate,
            remittanceDate: validatedData.remittanceDate,
            grossAmount: amounts.grossAmount,
            labourCost: validatedData.labourCost,
            materialCost: validatedData.materialCost,
            cisAmount: amounts.cisAmount,
            netAmount: amounts.netAmount,
            submissionDate: validatedData.submissionDate,
            reverseCharge: amounts.reverseCharge,
            month: validatedData.month,
            year: validatedData.year,
            SubcontractorId: req.params.id
        });

        res.redirect(`/invoice/read/${newInvoice.id}`);

    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errorMessages = error.errors.map((err) => err.message);
            console.log('Validation errors:', errorMessages);
            return res.render('createInvoice', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                message: req.query.message || '',
            });
        }
        console.error('Error creating invoice:', error);
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};
const readInvoice = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const invoiceId = req.params.id;
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.render('viewInvoice', {
            invoice,
            session: req.session,
            packageJson,
            slimDateTime: slimDateTime,
            formatCurrency: formatCurrency,
        });
    } catch (error) {
        console.error('Error viewing invoice:', error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
};
const updateInvoice = async (req, res) => {
    try {
        validateInvoiceData(req.body);

        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (!invoice.SubcontractorId) {
            throw new Error(`No subcontractorId associated with invoice ID: ${req.params.id}`);
        }

        const subcontractor = await Subcontractor.findByPk(invoice.SubcontractorId);
        if (!subcontractor) {
            throw new Error(`Subcontractor with ID: ${invoice.SubcontractorId} not found for invoice ${req.params.id}`);
        }

        const amounts = calculateInvoiceAmounts(req.body.labourCost, req.body.materialCost, subcontractor.isGross, subcontractor.cisNumber, subcontractor.vatnumber);

        await Invoice.update({ ...req.body, ...amounts }, { where: { id: req.params.id } });

        req.flash('success', 'Invoice updated successfully');
        return res.redirect('/admin'); // Ensure to return here
    } catch (error) {
        console.error('Error updating invoice:', error.message);
        req.flash('error', `Error updating invoice with ID: ${req.params.id}. Details: ${error.message}`);
        return res.redirect(req.get('referer') || '/'); // Ensure to return here
    }
};

const deleteInvoice = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete invoices.');
        }

        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            // res.status(404).send('Invoice not found');
            return req.flash('error', 'Invoice not found');
        }

        await invoice.destroy();

        req.flash('success', 'Invoice deleted successfully');
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.header('Referer') || '/';
        res.redirect(referrer);
    }
};

router.post('/invoice/create/:selected', createInvoice);
router.get('/invoice/read/:id', readInvoice);
router.post('/invoice/update/:id', updateInvoice);
router.post('/invoice/delete/:id', deleteInvoice);

module.exports = router;