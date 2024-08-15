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
            return res.status(403).send('Access denied.');
        }
        
        if (req.params.subcontractor) {
            const subcontractor = await Subcontractor.findByPk(req.params.subcontractor);
            if (!subcontractor) {
                req.flash('error', 'Error: No Subcontractors exist.');
                res.redirect('/subcontractor/create');
            }
            res.render(path.join('invoices', 'createInvoice'), {
                title: 'Create Invoice',
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                
                
                subcontractor,
                slimDateTime: helpers.slimDateTime,
                formatCurrency: helpers.formatCurrency,
            });
        } else {
            res.status(404).send('Subcontractor not found');
        }
    } catch (error) {
        logger.error('Error rendering invoice create form:' + error.message);
        req.flash('error', 'Error rendering invoice create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderInvoiceUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
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

router.get('/invoice/create/:subcontractor', renderInvoiceCreateForm);
router.get('/invoice/update/:invoice', renderInvoiceUpdateForm);

module.exports = router;