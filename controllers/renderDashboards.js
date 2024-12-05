const express = require('express');
const router = express.Router();
const moment = require('moment');
const helpers = require('../helpers');
const logger = require('../services/loggerService');
const { Op } = require("sequelize");
const path = require('path');
const db = require('../services/sequelizeDatabaseService');
const taxService = require('../services/taxService');
const currencyService = require('../services/currencyService');
const dateService = require('../services/dateService');
const authService = require('../services/authService');

const renderStatsDashboard = async (req, res) => {
    try {
        console.log("Session User:", req.session.user);
        // Fetch the specified year and month from the URL parameters
        const specifiedYear = parseInt(req.params.year);
        const specifiedMonth = parseInt(req.params.month);

        // Ensure valid values for year and month
        if (isNaN(specifiedYear) || isNaN(specifiedMonth) || specifiedMonth < 1 || specifiedMonth > 12) {
            return res.status(400).send('Invalid year or month.');
        }

        // Fetch all subcontractors and invoices
        const subcontractors = await db.Subcontractors.findAll();
        const invoices = await db.Invoices.findAll({ order: [['updatedAt', 'ASC']] });

        // Determine the tax year start and end dates and the current monthly return period
        const taxYear = taxService.getTaxYearStartEnd(specifiedYear);
        const currentMonthlyReturn = taxService.getCurrentMonthlyReturn(specifiedYear, specifiedMonth);

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

            subcontractorTotals[invoice.subcontractorId].grossTotal = currencyService.rounding(subcontractorTotals[invoice.subcontractorId].grossTotal + invoice.grossAmount, false);
            subcontractorTotals[invoice.subcontractorId].materialTotal = currencyService.rounding(subcontractorTotals[invoice.subcontractorId].materialTotal + invoice.materialCost, false);
            subcontractorTotals[invoice.subcontractorId].cisTotal = currencyService.rounding(subcontractorTotals[invoice.subcontractorId].cisTotal + invoice.cisAmount, false);

            if (invoice.reverseCharge) {
                subcontractorTotals[invoice.subcontractorId].reverseChargeTotal = currencyService.rounding(subcontractorTotals[invoice.subcontractorId].reverseChargeTotal + invoice.reverseCharge, false);
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
            

            taxYear,
            currentMonthlyReturn,
            previousYear,
            previousMonth,
            nextYear,
            nextMonth,
            allInvoicesSubmitted,
            submissionDate,
            submissionStartDate,
            submissionEndDate,
            specifiedYear,
            specifiedMonth
        });
    } catch (error) {
        logger.error('Error rendering stats dashboard: ' + error.message);
        req.flash('error', 'Error rendering stats dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderUserDashboard = async (req, res) => {
    try {
        const users = await db.Users.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'usersDashboard'), {
            title: 'Users',
            users,
            
            

        });
    } catch (error) {
        logger.error('Error rendering users dashboard: ' + error.message);
        req.flash('error', 'Error rendering users dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderInvoiceDashboard = async (req, res) => {
    try {
        const invoices = await db.Invoices.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'invoicesDashboard'), {
            title: 'Invoices',
            invoices,
            
            

        });
    } catch (error) {
        logger.error('Error rendering invoices dashboard:' + error.message);
        req.flash('error', 'Error rendering invoices dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderSubcontractorDashboard = async (req, res) => {
    try {
        const subcontractors = await db.Subcontractors.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'subcontractorsDashboard'), {
            title: 'Subcontractors',
            subcontractors,
            
            

        });
    } catch (error) {
        logger.error('Error rendering subcontractors dashboard:' + error.message);
        req.flash('error', 'Error rendering subcontractors dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderQuotesDashboard = async (req, res) => {
    try {
        const quotes = await db.Quotes.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: db.Clients,
                    include: [{ model: db.Contacts }]
                },
                {
                    model: db.Locations,
                }
            ]
        });

        res.render(path.join('dashboards', 'quotesDashboard'), {
            title: 'Quotes',
            quotes,
            

        });
    } catch (error) {
        logger.error('Error rendering quotes dashboard: ' + error.message);
        req.flash('error', 'Error rendering quotes dashboard: ' + error.message);
        return res.redirect('/');
    }
};


const renderClientsDashboard = async (req, res) => {
    try {
        const clients = await db.Clients.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'clientsDashboard'), {
            title: 'Clients',
            clients,
            
            

        });
    } catch (error) {
        logger.error('Error rendering clients dashboard:' + error.message);
        req.flash('error', 'Error rendering clients dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderContactsDashboard = async (req, res) => {
    try {
        const contacts = await db.Contacts.findAll({ order: [['createdAt', 'DESC']], include: [db.Clients] });

        res.render(path.join('dashboards', 'contactsDashboard'), {
            title: 'Contacts',
            contacts,
            
            

        });
    } catch (error) {
        logger.error('Error rendering contacts dashboard:' + error.message);
        req.flash('error', 'Error rendering contacts dashboard: ' + error.message);
        return res.redirect('/');
    }
};

const renderJobsDashboard = async (req, res) => {
    try {
        // Fetch jobs with a non-empty job_ref
        const jobs = await db.Jobs.findAll({
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
            const client = job.clientId ? await db.Clients.findByPk(job.clientId) : null;

            // Ensure contactId exists before querying Contacts (assuming job.contactId is the field you want)
            const contact = job.contactId ? await db.Contacts.findOne({
                where: {
                    id: job.contactId,
                    clientId: job.clientId
                }
            }) : null;

            const location = job.locationId ? await db.Locations.findByPk(job.locationId) : null;

            const quote = job.quoteId ? await db.Quotes.findByPk(job.quoteId) : null;

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
            

        });
    } catch (error) {
        // Log the error
        logger.error('Error rendering jobs dashboard: ' + error.message);
        req.flash('error', 'Error rendering jobs dashboard: ' + error.message);
        res.redirect('/');
    }
};

// Read all locations
const renderLocationsDashboard = async (req, res) => {
    try {
        const locations = await db.Locations.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'locationsDashboard'), {
            title: 'Locations',
            locations,
            
        });
    } catch (error) {
        logger.error('Error rendering locations dashboard: ' + error.message);
        req.flash('error', 'Error rendering locations dashboard: ' + error.message);
        res.redirect('/');
    }
};

const renderAttendanceDashboard = async (req, res) => {
    try {
        // Extract query parameters from the request
        const { date, employeeId, subcontractorId } = req.query;

        // Build the query conditions
        let queryConditions = {};

        if (date) {
            queryConditions.date = date;
        }

        if (employeeId) {
            queryConditions.employeeId = employeeId;
        }

        if (subcontractorId) {
            queryConditions.subcontractorId = subcontractorId;
        }

        // Fetch the attendance records based on query conditions
        const attendances = await db.Attendances.findAll({
            where: queryConditions,
            include: [
                { model: db.Employees, required: false },
                { model: db.Subcontractors, required: false },
                { model: db.Locations, required: false },
            ],
        });

        // Fetch all employees, subcontractors, and locations to populate the filters
        const employees = await db.Employees.findAll();
        const subcontractors = await db.Subcontractors.findAll();
        const locations = await db.Locations.findAll();

        // Render the dashboard with the attendance data and filters
        res.render(path.join('dashboards', 'attendanceDashboard'), {
            attendances,
            employees,
            subcontractors,
            locations,
            filters: { date, employeeId, subcontractorId },
            
        });
    } catch (error) {
        logger.error('Error rendering attendance dashboard: ' + error.message);
        req.flash('error', 'Error rendering attendance dashboard: ' + error.message);
        res.redirect('/');
    }
};

const renderEmployeeDashboard = async (req, res) => {
    try {
        // Fetch all employees from the database
        const employees = await db.Employees.findAll();

        // Calculate the total number of employees
        const totalEmployees = employees.length;

        // Render the dashboard view, passing in the employee data
        res.render('dashboards/employeeDashboard', {
            employees,
            totalEmployees,
            
        });
    } catch (error) {
        logger.error('Error rendering employee dashboard: ' + error.message);
        req.flash('error', 'Error rendering employee dashboard: ' + error.message);
        res.redirect('/');
    }
};

const renderKFInvoicesDashboard = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error rendering KFInvoices dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFInvoices dashboard: ' + error.message);
        res.redirect('/');
    }
};

const renderKFCustomersDashboard = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error rendering KFCustomers dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFCustomers dashboard: ' + error.message);
        res.redirect('/');
    }
};

const renderKFProjectsDashboard = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error rendering KFProjects dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFProjects dashboard: ' + error.message);
        res.redirect('/');
    }
};

const renderKFQuotesDashboard = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error rendering KFQuotes dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFQuotes dashboard: ' + error.message);
        res.redirect('/');
    }
};

const renderKFReceiptsDashboard = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error rendering KFReceipts dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFReceipts dashboard: ' + error.message);
        res.redirect('/');
    }
};

const renderKFSuppliersDashboard = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error rendering KFSuppliers dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFSuppliers dashboard: ' + error.message);
        res.redirect('/');
    }
};

router.get('/dashboard/stats', authService.ensureAuthenticated, authService.ensureRole('admin'), (req, res) => {
    try {
        const { taxYear, taxMonth } = authService.calculateTaxYearAndMonth(moment());
        logger.info(`Tax Year: ${taxYear}, Tax Month: ${taxMonth}`);
        return res.redirect(`/dashboard/stats/${taxYear}/${taxMonth}`);
    } catch (error) {
        logger.error('Error rendering jobs dashboard:' + error.message);
        req.flash('error', 'Error rendering jobs dashboard: ' + error.message);
        return res.redirect('/');
    }
});
router.get('/dashboard/stats/:year?/:month?', authService.ensureAuthenticated, authService.ensureRole('admin'), renderStatsDashboard);
router.get('/dashboard/user', authService.ensureAuthenticated, authService.ensureRole('admin'), renderUserDashboard);
router.get('/dashboard/subcontractor', authService.ensureAuthenticated, authService.ensureRole('admin'), renderSubcontractorDashboard);
router.get('/dashboard/invoice', authService.ensureAuthenticated, authService.ensureRole('admin'), renderInvoiceDashboard);
router.get('/dashboard/quote', authService.ensureAuthenticated, authService.ensureRole('admin'), renderQuotesDashboard);
router.get('/dashboard/client', authService.ensureAuthenticated, authService.ensureRole('admin'), renderClientsDashboard);
router.get('/dashboard/contact', authService.ensureAuthenticated, authService.ensureRole('admin'), renderContactsDashboard);
router.get('/dashboard/job', authService.ensureAuthenticated, authService.ensureRole('admin'), renderJobsDashboard);
//router.get('/dashboard/archive', authService.ensureAuthenticated, authService.ensureRole('admin'), renderQuoteArchiveDashboard);
router.get('/dashboard/location', authService.ensureAuthenticated, authService.ensureRole('admin'), renderLocationsDashboard);
router.get('/dashboard/attendance', authService.ensureAuthenticated, authService.ensureRole('admin'),renderAttendanceDashboard);
router.get('/dashboard/employee', authService.ensureAuthenticated, authService.ensureRole('admin'),renderEmployeeDashboard);

module.exports = router;