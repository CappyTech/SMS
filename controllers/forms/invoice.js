const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');

const renderInvoiceCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        
        const subcontractors = await db.Subcontractors.findAll({
            order: [['company', 'ASC']]
        });
        res.render(path.join('invoices', 'createInvoice'), {
            title: 'Create Invoice',
            
            subcontractors,

        });
    } catch (error) {
        logger.error('Error rendering invoice create form:' + error.message);
        req.flash('error', 'Error rendering invoice create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderInvoiceUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const invoice = await db.Invoices.findByPk(req.params.invoice);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render(path.join('invoices', 'updateInvoice'), {
            title: 'Update Invoice',
            invoice,
            

        });
    } catch (error) {
        logger.error('Error rendering invoice update form:  ', error.message);
        req.flash('error', 'Error rendering invoice update form: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/invoice/create/', authService.ensureAuthenticated, authService.ensureRole('admin'), renderInvoiceCreateForm);
router.get('/invoice/update/:invoice', authService.ensureAuthenticated, authService.ensureRole('admin'), renderInvoiceUpdateForm);

module.exports = router;