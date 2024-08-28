const express = require('express');
const router = express.Router();
const moment = require('moment');
const helpers = require('../helpers');
const logger = require('../logger');
const { Op } = require("sequelize");
const Users = require('../models/user');
const Invoices = require('../models/invoice');
const Subcontractors = require('../models/subcontractor');
const Quotes = require('../models/quote');
const Clients = require('../models/client');
const Contacts = require('../models/contact');
const Jobs = require('../models/job');
const Locations = require('../models/location');
const path = require('path');

const renderStatsDashboard = async (req, res) => {
    try {
        console.log("Session User:", req.session.user);
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied. Stats 2');
            return res.redirect('/');
        }

        // Fetch the specified year and month from the URL parameters
        const specifiedYear = parseInt(req.params.year);
        const specifiedMonth = parseInt(req.params.month);

        // Ensure valid values for year and month
        if (isNaN(specifiedYear) || isNaN(specifiedMonth) || specifiedMonth < 1 || specifiedMonth > 12) {
            return res.status(400).send('Invalid year or month.');
        }

        // Fetch all subcontractors and invoices
        const subcontractors = await Subcontractors.findAll();
        const invoices = await Invoices.findAll({ order: [['updatedAt', 'ASC']] });

        // Determine the tax year start and end dates and the current monthly return period
        const taxYear = helpers.getTaxYearStartEnd(specifiedYear);
        const currentMonthlyReturn = helpers.getCurrentMonthlyReturn(specifiedYear, specifiedMonth);

        // Filter invoices for the current monthly return period
        const filteredInvoices = invoices.filter(invoice =>
            moment(invoice.remittanceDate).isBetween(currentMonthlyReturn.periodStart, currentMonthlyReturn.periodEnd, null, '[]')
        );

        // Extract the subcontractor IDs from the filtered invoices
        const subcontractorIds = filteredInvoices.map(invoice => invoice.subcontractorId);

        // Filter subcontractors based on their ID in the filtered invoices
        const filteredSubcontractors = subcontractors.filter(sub =>
            subcontractorIds.includes(sub.id)
        );

        // Calculate the relevant totals for each subcontractor (Gross, Materials, CIS, Reverse Charge)
        const subcontractorTotals = {};
        filteredInvoices.forEach(invoice => {
            if (!subcontractorTotals[invoice.subcontractorId]) {
                subcontractorTotals[invoice.subcontractorId] = {
                    grossTotal: 0,
                    materialTotal: 0,
                    cisTotal: 0,
                    reverseChargeTotal: 0
                };
            }

            subcontractorTotals[invoice.subcontractorId].grossTotal = helpers.rounding(subcontractorTotals[invoice.subcontractorId].grossTotal + invoice.grossAmount, false);
            subcontractorTotals[invoice.subcontractorId].materialTotal = helpers.rounding(subcontractorTotals[invoice.subcontractorId].materialTotal + invoice.materialCost, false);
            subcontractorTotals[invoice.subcontractorId].cisTotal = helpers.rounding(subcontractorTotals[invoice.subcontractorId].cisTotal + invoice.cisAmount, false);

            if (invoice.reverseCharge) {
                subcontractorTotals[invoice.subcontractorId].reverseChargeTotal = helpers.rounding(subcontractorTotals[invoice.subcontractorId].reverseChargeTotal + invoice.reverseCharge, false);
            }
        });

        // Calculate the previous and next periods for pagination
        const previousMonth = specifiedMonth === 1 ? 12 : specifiedMonth - 1;
        const previousYear = specifiedMonth === 1 ? specifiedYear - 1 : specifiedYear;
        const nextMonth = specifiedMonth === 12 ? 1 : specifiedMonth + 1;
        const nextYear = specifiedMonth === 12 ? specifiedYear + 1 : specifiedYear;

        // Check if all invoices are submitted and capture submission date
        const allInvoicesSubmitted = filteredInvoices.every(invoice => invoice.submissionDate !== null);
        const submissionDate = allInvoicesSubmitted && filteredInvoices.length > 0 ? filteredInvoices[0].submissionDate : null;

        // Use currentMonthlyReturn.periodEndDisplay to determine the correct submission window
        const periodEnd = moment(currentMonthlyReturn.periodEndDisplay, 'Do MMMM YYYY');
        const submissionStartDate = periodEnd.clone().date(7).format('Do MMMM YYYY');
        const submissionEndDate = periodEnd.clone().date(11).format('Do MMMM YYYY');

        // Render the stats dashboard view with the necessary data
        res.render(path.join('dashboards', 'statsDashboard'), {
            title: 'Overview',
            subcontractorCount: filteredSubcontractors.length,
            invoiceCount: filteredInvoices.length,
            subcontractors: filteredSubcontractors,
            invoices: filteredInvoices,
            subcontractorTotals,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
            taxYear,
            currentMonthlyReturn,
            previousYear,
            previousMonth,
            nextYear,
            nextMonth,
            allInvoicesSubmitted,
            submissionDate,
            submissionStartDate,
            submissionEndDate
        });
    } catch (error) {
        logger.error('Error rendering stats dashboard: ' + error.message);
        req.flash('error', 'Error rendering stats dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderUserDashboard = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const users = await Users.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'usersDashboard'), {
            title: 'Users',
            users,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering users dashboard: ' + error.message);
        req.flash('error', 'Error rendering users dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderInvoiceDashboard = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const invoices = await Invoices.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'invoicesDashboard'), {
            title: 'Invoices',
            invoices,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
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
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const subcontractors = await Subcontractors.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'subcontractorsDashboard'), {
            title: 'Subcontractors',
            subcontractors,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
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
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const quotes = await Quotes.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Clients,
                    include: [{ model: Contacts }]
                },
                {
                    model: Locations,
                }
            ]
        });

        res.render(path.join('dashboards', 'quotesDashboard'), {
            title: 'Quotes',
            quotes,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering quotes dashboard: ' + error.message);
        req.flash('error', 'Error rendering quotes dashboard: ' + error.message);
        return res.redirect('/');
    }
};


const renderClientsDashboard = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const clients = await Clients.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'clientsDashboard'), {
            title: 'Clients',
            clients,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
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
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const contacts = await Contacts.findAll({ order: [['createdAt', 'DESC']], include: [Clients] });

        res.render(path.join('dashboards', 'contactsDashboard'), {
            title: 'Contacts',
            contacts,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
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
        // Ensure only admin can access
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        // Fetch jobs with a non-empty job_ref
        const jobs = await Jobs.findAll({
            where: {
                job_ref: {
                    [Op.ne]: ""
                }
            },
            order: [['createdAt', 'DESC']],
        });

        // Fetch associated clients and contacts
        const jobsWithAssociations = await Promise.all(jobs.map(async job => {
            // Ensure clientId exists before querying Clients
            const client = job.clientId ? await Clients.findByPk(job.clientId) : null;

            // Ensure contactId exists before querying Contacts (assuming job.contactId is the field you want)
            const contact = job.contactId ? await Contacts.findOne({
                where: {
                    id: job.contactId,
                    clientId: job.clientId
                }
            }) : null;

            const location = job.locationId ? await Locations.findByPk(job.locationId) : null;

            const quote = job.quoteId ? await Quotes.findByPk(job.quoteId) : null;

            // Return job along with its associated client and contact
            return {
                ...job.toJSON(),
                client: client || {},
                contact: contact || {},
                location: location || {},
                quote: quote || {},
            };
        }));

        // Log to check the result
        logger.info('Jobs with Associations: ' + JSON.stringify(jobsWithAssociations, null, 2));

        // Render the jobs dashboard
        res.render(path.join('dashboards', 'jobsDashboard'), {
            title: 'Jobs',
            jobs: jobsWithAssociations,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        // Log the error
        logger.error('Error rendering jobs dashboard: ' + error.message);
        req.flash('error', 'Error rendering jobs dashboard: ' + error.message);
        res.redirect('/');
    }
};


router.get('/dashboard/stats', (req, res) => {
    try {
        //if (!req.session.user || req.session.user.role !== 'admin') {
            //req.flash('error', 'Access denied. Stats 1');
            //return res.redirect('/');
        //}
        const { taxYear, taxMonth } = helpers.calculateTaxYearAndMonth(moment());
        // Output for debugging
        logger.info(`Tax Year: ${taxYear}, Tax Month: ${taxMonth}`);
        // Redirect to the dashboard with the calculated tax year and month
        res.redirect(`/dashboard/stats/${taxYear}/${taxMonth}`);
    } catch (error) {
        logger.error('Error rendering jobs dashboard:' + error.message);
        req.flash('error', 'Error rendering jobs dashboard: ' + error.message);
        res.redirect('/');
    }
});

// Read all locations
const renderLocationsDashboard = async (req, res) => {
    try {
        const locations = await Locations.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'locationsDashboard'), {
            title: 'Locations',
            locations,
            slimDateTime: helpers.slimDateTime,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error viewing locations: ' + error.message);
        req.flash('error', 'Error viewing locations: ' + error.message);
        res.redirect('/dashboard/location');
    }
};

router.get('/dashboard/stats/:year?/:month?', renderStatsDashboard);
router.get('/dashboard/user', renderUserDashboard);
router.get('/dashboard/subcontractor', renderSubcontractorDashboard);
router.get('/dashboard/invoice', renderInvoiceDashboard);
router.get('/dashboard/quote', renderQuotesDashboard);
router.get('/dashboard/client', renderClientsDashboard);
router.get('/dashboard/contact', renderContactsDashboard);
router.get('/dashboard/job', renderJobsDashboard);
//router.get('/dashboard/archive', renderQuoteArchiveDashboard);
router.get('/dashboard/location', renderLocationsDashboard);

module.exports = router;