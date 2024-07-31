const express = require('express');
const router = express.Router();
const moment = require('moment');
const helpers = require('../helpers');
const logger = require('../logger');
const packageJson = require('../package.json');

const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const Quote = require('../models/quote');
const Client = require('../models/client');
const Contact = require('../models/contact');

const renderstatsDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        // Fetch the specified tax year from the URL parameter or use the current tax year
        const specifiedYear = req.params.year ? parseInt(req.params.year) : helpers.getCurrentTaxYear();

        // Fetch all subcontractors and invoices
        const subcontractors = await Subcontractor.findAll();
        const invoices = await Invoice.findAll({ order: [['updatedAt', 'ASC']] });

        // Determine the start and end of the specified tax year
        const taxYear = helpers.getTaxYearStartEnd(specifiedYear);
        const currentMonthlyReturn = helpers.getCurrentMonthlyReturn();

        // Filter invoices for the current monthly return period
        const filteredInvoices = invoices.filter(invoice =>
            moment(invoice.remittanceDate).isBetween(currentMonthlyReturn.periodStart, currentMonthlyReturn.periodEnd, null, '[]')
        );

        // Extract the SubcontractorId from the filtered invoices
        const subcontractorIds = filteredInvoices.map(invoice => invoice.SubcontractorId);

        // Filter subcontractors based on the SubcontractorId in the filtered invoices
        const filteredSubcontractors = subcontractors.filter(sub =>
            subcontractorIds.includes(sub.id)
        );

        res.render('statsDashboard', {
            subcontractorCount: filteredSubcontractors.length,
            invoiceCount: filteredInvoices.length,
            subcontractors: filteredSubcontractors,
            invoices: filteredInvoices,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
            taxYear,
            currentMonthlyReturn
        });
    } catch (error) {
        logger.error('Error rendering stats dashboard: ', error.message);
        req.flash('error', 'Error rendering stats dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderUserDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const users = await User.findAll({ order: [['createdAt', 'DESC']] });

        res.render('usersDashboard', {
            users,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering users dashboard: ', error.message);
        req.flash('error', 'Error rendering users dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderInvoiceDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const invoices = await Invoice.findAll({ order: [['createdAt', 'DESC']] });

        res.render('invoicesDashboard', {
            invoices,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering invoices dashboard: ', error.message);
        req.flash('error', 'Error rendering invoices dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderSubcontractorDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractors = await Subcontractor.findAll({ order: [['createdAt', 'DESC']] });

        res.render('subcontractorsDashboard', {
            subcontractors,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering subcontractors dashboard: ', error.message);
        req.flash('error', 'Error rendering subcontractors dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderQuotesDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const quotes = await Quote.findAll({ order: [['createdAt', 'DESC']] });

        res.render('quotesDashboard', {
            quotes,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering quotes dashboard: ', error.message);
        req.flash('error', 'Error rendering quotes dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderClientsDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const clients = await Client.findAll({ order: [['createdAt', 'DESC']] });

        res.render('clientsDashboard', {
            clients,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering clients dashboard: ', error.message);
        req.flash('error', 'Error rendering clients dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderContactsDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const contacts = await Contact.findAll({ order: [['createdAt', 'DESC']], include: [Client] });

        res.render('contactsDashboard', {
            contacts,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering contacts dashboard: ', error.message);
        req.flash('error', 'Error rendering contacts dashboard: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/dashboard/stats', renderstatsDashboard);
router.get('/dashboard/user', renderUserDashboard);
router.get('/dashboard/subcontractor', renderSubcontractorDashboard);
router.get('/dashboard/invoice', renderInvoiceDashboard);
router.get('/dashboard/quote', renderQuotesDashboard);
router.get('/dashboard/client', renderClientsDashboard);
router.get('/dashboard/contact', renderContactsDashboard);

module.exports = router;