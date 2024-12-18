const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService'); 
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');
const validationService = require('../../services/validationService');
const cisService = require('../../services/cisService');
const taxService = require('../../services/taxService');

const createInvoice = async (req, res) => {
    try {
        const validatedData = validationService.validateInvoiceData(req.body);
        const subcontractor = await db.Subcontractors.findByPk(req.params.selected);
        const amounts = cisService.calculateInvoiceAmounts(validatedData.labourCost, validatedData.materialCost, subcontractor.deduction, subcontractor.cisNumber, subcontractor.vatNumber);

        // If remittanceDate or submissionDate are not provided, set them to null
        validatedData.remittanceDate = validatedData.remittanceDate || null;
        validatedData.submissionDate = validatedData.submissionDate || null;

        // Calculate Tax Year and Tax Month
        const { taxYear, taxMonth } = taxService.calculateTaxYearAndMonth(validatedData.remittanceDate);

        // Create invoice record
        const newInvoice = await db.Invoices.create({
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
            month: taxMonth,
            year: taxYear,
            subcontractorId: req.params.selected,
            cisRate: amounts.cisRate
        });

        res.redirect(`/invoice/read/${newInvoice.id}`);

    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errorMessages = error.errors.map((err) => err.message);
            logger.error(`Validation errors: ${errorMessages.join(', ')}`);
            return res.render('createInvoice', {
                title: 'Create Invoice',
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
            });
        }
        logger.error('Error creating invoice: ' + error.message);
        req.flash('error', 'Error: ' + error.message);
        res.redirect('/error');
    }
};

const updateInvoice = async (req, res) => {
    try {
        const invoice = await db.Invoices.findByPk(req.params.invoice);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        if (!invoice.subcontractorId) {
            logger.error(`No subcontractorId associated with invoice number: ${req.params.invoice}`);
        }
        const subcontractor = await db.Subcontractors.findByPk(invoice.subcontractorId);
        if (!subcontractor) {
            logger.error(`Subcontractor with ID: ${invoice.subcontractorId} not found for invoice ${req.params.invoice}`);
        }
        const amounts = cisService.calculateInvoiceAmounts(req.body.labourCost, req.body.materialCost, subcontractor.deduction, subcontractor.cisNumber, subcontractor.vatNumber, subcontractor.isGross, subcontractor.isReverseCharge);

        await db.Invoices.update({ ...req.body, ...amounts }, { where: { id: req.params.invoice } });

        req.flash('success', 'Invoice updated successfully');
        return res.redirect(`/invoice/read/${req.params.invoice}`);
    } catch (error) {
        logger.error(`Error updating invoice with ID: ${req.params.invoice}. Details:` + error.message);
        req.flash('error', `Error updating invoice with ID: ${req.params.invoice}. Details:` + error.message);
        return res.redirect(`/invoice/read/${req.params.invoice}`);
    }
};

const readInvoice = async (req, res) => {
    try {
        const invoice = await db.Invoices.findByPk(req.params.invoice, {
            include: [
                { model: db.Subcontractors }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.render(path.join('invoices', 'viewInvoice'), {
            title: 'Invoice',
            invoice,
        });
    } catch (error) {
        logger.error('Error viewing invoice: ' + error.message);
        req.flash('error', 'Error viewing invoice: ' + error.message);
        res.redirect('/error');
    }
};

const readInvoices = async (req, res) => {
    try {
        const subcontractor = await db.Subcontractors.findByPk(req.params.subcontractor);
        const invoices = await db.Invoices.findAll({
            include: [
                {
                    model: db.Subcontractors,
                    where: { id: req.params.subcontractor }
                }
            ],
            order: [['invoiceNumber', 'DESC']]
        });

        if (!invoices) {
            return res.status(404).json({ error: 'Invoices not found' });
        }

        res.render(path.join('invoices', 'viewInvoices'), {
            title: 'Invoices',
            subcontractor,
            invoices,
        });
    } catch (error) {
        logger.error('Error viewing invoices:'+ error.message);
        req.flash('error', 'Error viewing invoices:' + error.message);
        res.redirect('/error');
    }
};

const deleteInvoice = async (req, res) => {
    try {
        // Check if the user is an admin
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        // TODO: Add subcontractorId to the invoice model and refer back to the /invoices/read/:id route
        const invoice = await db.Invoices.findByPk(req.params.invoice);

        if (!invoice) {
            req.flash('error', 'Invoice not found');
            return res.redirect(req.get('referer') || '/dashboard/stats');
        }

        await invoice.destroy();

        req.flash('success', 'Invoice deleted successfully');
        res.redirect('/dashboard/invoice');
    } catch (error) {
        logger.error('Error deleting invoice: ' + error.message);
        req.flash('error', 'Error deleting invoice: ' + error.message);
        res.redirect('/error');
    }
};

router.get('/fetch/invoice/:id', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const invoice = await db.Invoices.findAll({
            where: { id: req.params.id },
            order: [['createdAt', 'ASC']],
        });

        res.json({ invoice });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

router.get('fetch/unpaidinvoices', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const unpaidInvoices = await db.Invoices.findAll({
            where: { remittanceDate: null },
            attributes: ['id', 'kashflowNumber'],
            order: [['kashflowNumber', 'ASC']]
        });

        res.json({ unpaidInvoices });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unpaid invoices' });
    }
});

router.get('fetch/unsubmittedinvoices', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const unsubmittedInvoices = await db.Invoices.findAll({
            where: { submissionDate: null },
            attributes: ['id', 'kashflowNumber'],
            order: [['kashflowNumber', 'ASC']]
        });

        res.json({ unsubmittedInvoices });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unsubmitted invoices' });
    }
});

router.post('/invoice/create/:selected', authService.ensureAuthenticated, createInvoice);
router.get('/invoice/read/:invoice', authService.ensureAuthenticated, readInvoice);
router.get('/invoices/read/:subcontractor', authService.ensureAuthenticated, readInvoices);
router.post('/invoice/update/:invoice', authService.ensureAuthenticated, updateInvoice);
router.post('/invoice/delete/:invoice', authService.ensureAuthenticated, deleteInvoice);

module.exports = router;
