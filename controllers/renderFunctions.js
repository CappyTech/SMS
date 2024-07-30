const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const Quote = require('../models/quote');
const moment = require('moment');
const helpers = require('../helpers');
const logger = require('../logger'); // Import the logger
const Subcontractors = require('../models/subcontractor');

const renderIndex = (req, res) => {
    res.render('index', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
    });
};

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
        res.redirect('/');
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
        res.redirect('/');
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
        logger.error('Error rendering user create form: ', error.message);
        req.flash('error', 'Error rendering user create form: ' + error.message);
        res.redirect('/');
    }
};

const renderUserUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const userId = req.params.user;
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
        logger.error('Error rendering user update form: ', error.message);
        req.flash('error', 'Error rendering user update form: ' + error.message);
        res.redirect('/');
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
        res.redirect('/');
    }
};

const renderInvoiceCreateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        
        if (req.params.subcontractor) {
            const subcontractor = await Subcontractor.findByPk(req.params.subcontractor);
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
                formatCurrency: helpers.formatCurrency,
            });
        } else {
            res.status(404).send('Subcontractor not found');
        }
    } catch (error) {
        logger.error('Error rendering invoice create form: ', error.message);
        req.flash('error', 'Error rendering invoice create form: ' + error.message);
        res.redirect('/');
    }
};

const renderInvoiceUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const invoice = await Invoice.findByPk(req.params.invoice);

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
        logger.error('Error rendering invoice update form:  ', error.message);
        req.flash('error', 'Error rendering invoice update form: ' + error.message);
        res.redirect('/');
    }
};

const selectSubcontractor = async (req, res) => {
    try {
        
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
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error selecting subcontractor: ', error.message);
        req.flash('error', 'Error selecting subcontractor: ' + error.message);
        res.redirect('/');
    }
};

const renderSubcontractorDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractors = await Subcontractors.findAll({ order: [['createdAt', 'DESC']] });

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
        res.redirect('/');
    }
};

const renderSubcontractorCreateForm = (req, res) => {
    try {
        
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
        logger.error('Error rendering subcontractor create form: ', error.message);
        req.flash('error', 'Error rendering subcontractor create form: ' + error.message);
        res.redirect('/');
    }
};

const renderSubcontractorUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.subcontractor;
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
        logger.error('Error rendering subcontractor update form: ', error.message);
        req.flash('error', 'Error rendering subcontractor update form: ' + error.message);
        res.redirect('/');
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
        res.redirect('/');
    }
};

const renderQuoteCreateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        res.render('createQuote', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering quote create form: ', error.message);
        req.flash('error', 'Error rendering quotes create form: ' + error.message);
        res.redirect('/');
    }
};

const renderQuoteUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const quote = await Quote.findByPk(req.params.quote);

        if (!quote) {
            return res.status(404).send('Quote not found');
        }

        res.render('updateQuote', {
            quote,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering quote update form:  ', error.message);
        req.flash('error', 'Error rendering quote update form: ' + error.message);
        res.redirect('/');
    }
};

const selectClient = async (req, res) => {
    try {
        
        let clients;
        if (req.session.user.role === 'admin') {
            clients = await Subcontractor.findAll({});
        } else {
            clients = await Subcontractor.findAll({
                where: {
                    userId: req.session.user.id
                }
            });
        }

        if (clients.length === 0) {
            req.flash('error', 'Error: No Subcontractors exist, Or you don\'t have access to any Subcontractors.');
            res.redirect('/subcontractor/create');
        }

        res.render('selectClient', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            clients,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error selecting client:  ', error.message);
        req.flash('error', 'Error selecting client: ' + error.message);
        res.redirect('/');
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
        logger.error('Error rendering 500 page:  ', error.message);
        req.flash('error', 'Error rendering 500 page: ' + error.message);
        res.redirect('/');
    }
};

router.get('/', renderIndex);
router.get('/dashboard/stats', renderstatsDashboard);

router.get('/dashboard/user', renderUserDashboard);
router.get('/user/create', renderUserCreateForm);
router.get('/user/update/:user', renderUserUpdateForm);

router.get('/dashboard/subcontractor', renderSubcontractorDashboard);
router.get('/subcontractor/create', renderSubcontractorCreateForm);
router.get('/subcontractor/update/:subcontractor', renderSubcontractorUpdateForm);

router.get('/dashboard/invoice', renderInvoiceDashboard);
router.get('/invoice/create/:subcontractor', renderInvoiceCreateForm);
router.get('/invoice/update/:invoice', renderInvoiceUpdateForm);
router.get('/subcontractor/select', selectSubcontractor);

router.get('/dashboard/quote', renderQuotesDashboard);
router.get('/quote/create', renderQuoteCreateForm);
router.get('/quote/update/:quote', renderQuoteUpdateForm);
router.get('/client/select', selectClient);

router.get('/500', e500);

module.exports = router;
