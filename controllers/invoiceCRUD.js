// /controllers/invoiceCRUD.js

const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const {
    Op
} = require('sequelize');

const createInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
            kashflowNumber,
            invoiceDate,
            remittanceDate,
            labourCost,
            materialCost,
            submissionDate,
            month,
            year
        } = req.body;
        console.log(req.body);

        const subcontractor = await Subcontractor.findByPk(req.params.selected);

        if (!subcontractor) {
            console.error('Subcontractor not found');
            req.flash('error', 'Subcontractor not found');
            const referrer = req.get('referer') || '/';
            res.redirect(referrer);
        }

        if (submissionDate === '0000-00-00 00:00:00') {
            if (subcontractor.isGross) {
                const cisAmount = 0;
                const netAmount = parseInt(labourCost) - parseInt(cisAmount) + parseInt(materialCost);
                const grossAmount = parseInt(labourCost) + parseInt(materialCost);
                const reverseCharge = parseInt(grossAmount) * 0.2;

                const invoice = await Invoice.create({
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
                    month,
                    year,
                    SubcontractorId: subcontractor.id,
                });

                await subcontractor.addInvoice(invoice);
                console.log('Invoice was created with submission as null');
                req.flash('success', 'Invoice created successfully');
                const referrer = req.get('referer') || '/';
                res.redirect(referrer);
            } else {
                const cisAmount = parseInt(labourCost) * 0.2;
                const netAmount = parseInt(labourCost) - parseInt(cisAmount) + parseInt(materialCost);
                const grossAmount = parseInt(labourCost) + parseInt(materialCost);
                const reverseCharge = parseInt(grossAmount) * 0.2;

                const invoice = await Invoice.create({
                    invoiceNumber,
                    kashflowNumber,
                    invoiceDate,
                    remittanceDate,
                    grossAmount,
                    labourCost,
                    materialCost,
                    cisAmount,
                    netAmount,
                    submissionDate: null,
                    reverseCharge,
                    month,
                    year,
                    SubcontractorId: subcontractor.id,
                });

                await subcontractor.addInvoice(invoice);
                console.log('Invoice was created with submission as null');
                req.flash('success', 'Invoice created successfully');
                const referrer = req.get('referer') || '/';
                res.redirect(referrer);
            }
        } else {
            if (subcontractor.isGross) {
                const cisAmount = 0;
                const netAmount = parseInt(labourCost) - parseInt(cisAmount) + parseInt(materialCost);
                const grossAmount = parseInt(labourCost) + parseInt(materialCost);
                const reverseCharge = parseInt(grossAmount) * 0.2;

                const invoice = await Invoice.create({
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
                    month,
                    year,
                    SubcontractorId: subcontractor.id,
                });

                await subcontractor.addInvoice(invoice);
                console.log('Invoice was NOT created with submission as null');
                req.flash('success', 'Invoice created successfully');
                const referrer = req.get('referer') || '/';
                res.redirect(referrer);
            } else {
                const cisAmount = parseInt(labourCost) * 0.2;
                const netAmount = parseInt(labourCost) - parseInt(cisAmount) + parseInt(materialCost);
                const grossAmount = parseInt(labourCost) + parseInt(materialCost);
                const reverseCharge = parseInt(grossAmount) * 0.2;

                const invoice = await Invoice.create({
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
                    month,
                    year,
                    SubcontractorId: subcontractor.id,
                });

                await subcontractor.addInvoice(invoice);
                console.log('Invoice was NOT created with submission as null');
                req.flash('success', 'Invoice created successfully');
                const referrer = req.get('referer') || '/';
                res.redirect(referrer);
            }
        }
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
const viewInvoice = async (req, res) => {
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
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        console.error('Error viewing invoice:', error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
};
const updateInvoice = async (req, res) => {
    let message = 'Invoice updated.';
    let status = 200;

    try {
        validateInvoiceData(req.body);

        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) {
            message = 'Invoice not found.';
            status = 404;
            throw new Error(message);
        }

        const subcontractor = await Subcontractor.findByPk(invoice.SubcontractorId);
        if (!subcontractor) {
            message = `Subcontractor not found for the invoice with ID: ${req.params.id}`;
            status = 404;
            throw new Error(message);
        }

        const amounts = calculateInvoiceAmounts(req.body.labourCost, req.body.materialCost, req.body.submissionDate, subcontractor.isGross);

        await Invoice.update({
            ...req.body,
            ...amounts
        }, {
            where: {
                id: req.params.id
            }
        });

        req.flash('success', message);
    } catch (error) {
        console.error('Error updating invoice:', error.message);
        req.flash('error', `Error updating invoice with ID: ${req.params.id}. Details: ${error.message}`);
        status = 500;
    }

    return res.status(status).redirect('/admin');
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

router.post('/invoice/submit/:selected', createInvoice);
router.get('/invoice/view/:id', viewInvoice);
router.post('/invoice/update/:id', updateInvoice);
router.get('/invoice/delete/:id', deleteInvoice);

module.exports = router;