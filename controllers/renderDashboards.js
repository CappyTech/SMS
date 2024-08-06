const express = require('express');
const router = express.Router();
const moment = require('moment');
const helpers = require('../helpers');
const logger = require('../logger');
const packageJson = require('../package.json');
const { Op } = require("sequelize");
const Users = require('../models/user');
const Invoices = require('../models/invoice');
const Subcontractors = require('../models/subcontractor');
const Quotes = require('../models/quote');
const Clients = require('../models/client');
const Contacts = require('../models/contact');

const renderstatsDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        // Fetch the specified tax year from the URL parameter or use the current tax year
        const specifiedYear = req.params.year ? parseInt(req.params.year) : helpers.getCurrentTaxYear();

        // Fetch all subcontractors and invoices
        const subcontractors = await Subcontractors.findAll();
        const invoices = await Invoices.findAll({ order: [['updatedAt', 'ASC']] });

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
        logger.error('Error rendering stats dashboard:' + error.message);
        req.flash('error', 'Error rendering stats dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderUserDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const users = await Users.findAll({ order: [['createdAt', 'DESC']] });

        res.render('usersDashboard', {
            users,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering users dashboard:' + error.message);
        req.flash('error', 'Error rendering users dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderInvoiceDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const invoices = await Invoices.findAll({ order: [['createdAt', 'DESC']] });

        res.render('invoicesDashboard', {
            invoices,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering invoices dashboard:' + error.message);
        req.flash('error', 'Error rendering invoices dashboard: ' + error.message);
        return res.redirect('/');
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
        logger.error('Error rendering subcontractors dashboard:' + error.message);
        req.flash('error', 'Error rendering subcontractors dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderQuotesDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const quotes = await Quotes.findAll({ order: [['createdAt', 'DESC']] });

        res.render('quotesDashboard', {
            quotes,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering quotes dashboard:' + error.message);
        req.flash('error', 'Error rendering quotes dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderClientsDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const clients = await Clients.findAll({ order: [['createdAt', 'DESC']] });

        res.render('clientsDashboard', {
            clients,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering clients dashboard:' + error.message);
        req.flash('error', 'Error rendering clients dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderContactsDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const contacts = await Contacts.findAll({ order: [['createdAt', 'DESC']], include: [Client] });

        res.render('contactsDashboard', {
            contacts,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering contacts dashboard:' + error.message);
        req.flash('error', 'Error rendering contacts dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderJobsDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const jobs = await Quotes.findAll({
            where: {
                job_ref: {
                    [Op.ne]: ""
                }
            },
            order: [['createdAt', 'DESC']],
        });

        // Fetch associated clients and contacts
        const jobsWithAssociations = await Promise.all(jobs.map(async job => {
            const client = await Clients.findByPk(job.clientId);
            const contact = await Contacts.findOne({
                where: {
                    clientId: job.clientId,
                    id: job.contact_ref
                }
            });
            return {
                ...job.toJSON(),
                client,
                contact
            };
        }));

        res.render('jobsDashboard', {
            jobs: jobsWithAssociations,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering jobs dashboard:' + error.message);
        req.flash('error', 'Error rendering jobs dashboard: ' + error.message);
        res.redirect('/');
    }
};

router.get('/dashboard/stats', renderstatsDashboard);
router.get('/dashboard/user', renderUserDashboard);
router.get('/dashboard/subcontractor', renderSubcontractorDashboard);
router.get('/dashboard/invoice', renderInvoiceDashboard);
router.get('/dashboard/quote', renderQuotesDashboard);
router.get('/dashboard/client', renderClientsDashboard);
router.get('/dashboard/contact', renderContactsDashboard);
router.get('/dashboard/jobs', renderJobsDashboard);

module.exports = router;