const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const moment = require('moment');
const helpers = require('../helpers');
const logger = require('../logger'); // Import the logger

const renderIndex = (req, res) => {
    res.render('index', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
    });
};

const renderadminDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        logger.info('Session data:', req.session);

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

        res.render('adminDashboard', {
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
        logger.error('Error rendering admin dashboard:', error.message);
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.header('Referer') || '/';
        res.redirect(referrer);
    }
};

const renderUserCreateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        res.render('createUser', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering user create form:', error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

const renderSubcontractorCreateForm = (req, res) => {
    try {
        logger.info('Session data:', req.session);
        if (req.session.user.role === 'admin') {
            res.render('createSubcontractor', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
            });
        } else {
            return res.status(403).send('Access denied.');
        }
    } catch (error) {
        logger.error('Error rendering subcontractor create form:', error.message);
        req.flash('error', 'Error: ' + error.message);
        res.redirect(req.get('referer') || '/');
    }
};

const renderInvoiceCreateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        logger.info('Session data:', req.session);
        if (req.params.id) {
            const subcontractor = await Subcontractor.findByPk(req.params.id);
            if (!subcontractor) {
                req.flash('error', 'Error: No Subcontractors exist.');
                res.redirect('/subcontractor/create');
            }
            res.render('createInvoice', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                subcontractor,
                slimDateTime: helpers.slimDateTime,
            });
        } else {
            res.status(404).send('Subcontractor not found');
        }
    } catch (error) {
        logger.error('Error rendering invoice create form:', error.message);
        req.flash('error', 'Error: ' + error.message);
        res.redirect(req.get('referer') || '/');
    }
};

const renderUserUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const userId = req.params.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('updateUser', {
            user,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering user update form:', error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

const renderSubcontractorUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.id;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('updateSubcontractor', {
            subcontractor,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering subcontractor update form:', error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

const renderInvoiceUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render('updateInvoice', {
            invoice,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering invoice update form:', error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

const selectSubcontractor = async (req, res) => {
    try {
        logger.info('Session data:', req.session);
        let subcontractors;
        if (req.session.user.role === 'admin') {
            subcontractors = await Subcontractor.findAll({});
        } else {
            subcontractors = await Subcontractor.findAll({
                where: {
                    userId: req.session.user.id
                }
            });
        }

        if (subcontractors.length === 0) {
            req.flash('error', 'Error: No Subcontractors exist, Or you don\'t have access to any Subcontractors.');
            res.redirect('/subcontractor/create');
        }

        res.render('selectSubcontractor', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            subcontractors,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        logger.error('Error selecting subcontractor:', error.message);
        req.flash('error', 'Error: ' + error.message);
        res.redirect(req.get('referer') || '/');
    }
};

const e500 = async (req, res) => {
    try {
        res.render('500', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering 500 page:', error.message);
        req.flash('error', 'Error: ' + error.message);
        res.redirect(req.get('referer') || '/');
    }
};

router.get('/', renderIndex);
router.get('/dashboard/:year?', renderadminDashboard);
router.get('/user/create', renderUserCreateForm);
router.get('/subcontractor/create', renderSubcontractorCreateForm);
router.get('/invoice/create/:id', renderInvoiceCreateForm);
router.get('/user/update/:id', renderUserUpdateForm);
router.get('/subcontractor/update/:id', renderSubcontractorUpdateForm);
router.get('/invoice/update/:id', renderInvoiceUpdateForm);
router.get('/subcontractor/select', selectSubcontractor);
router.get('/500', e500);

module.exports = router;
