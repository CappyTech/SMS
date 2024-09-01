const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');
const path = require('path');
const Invoice = require('../../models/invoice');
const Subcontractor = require('../../models/subcontractor');

const renderInvoiceCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        
        const subcontractors = await Subcontractor.findAll();
        res.render(path.join('invoices', 'createInvoice'), {
            title: 'Create Invoice',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            subcontractors,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering invoice create form:' + error.message);
        req.flash('error', 'Error rendering invoice create form: ' + error.message);
        return res.redirect('/');
    }
};

// Assuming this is used as middleware to fetch subcontractor details dynamically
const getSubcontractorDetails = async (req, res) => {
    try {
        const subcontractor = await Subcontractor.findByPk(req.params.subcontractor);

        if (!subcontractor) {
            return res.status(404).json({ error: 'Subcontractor not found' });
        }
        logger.info(`Fetched subcontractor details: ${JSON.stringify(subcontractor)}`);
        res.json(subcontractor);
    } catch (error) {
        logger.error('Error fetching subcontractor details: ' + error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const renderInvoiceUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const invoice = await Invoice.findByPk(req.params.invoice);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render(path.join('invoices', 'updateInvoice'), {
            title: 'Update Invoice',
            invoice,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
            
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering invoice update form:  ', error.message);
        req.flash('error', 'Error rendering invoice update form: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/invoice/create/', renderInvoiceCreateForm);
router.get('/fetch/subcontractor/:subcontractor', getSubcontractorDetails)
router.get('/invoice/update/:invoice', renderInvoiceUpdateForm);

module.exports = router;