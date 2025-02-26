const express = require('express');
const router = express.Router();
const moment = require('moment');
const logger = require('../services/loggerService');
const path = require('path');
const db = require('../services/sequelizeDatabaseService');
const taxService = require('../services/taxService');
const currencyService = require('../services/currencyService');
const authService = require('../services/authService');
const kf = require('../services/kashflowDatabaseService');

/**
 * @swagger
 * /dashboard/stats/{year}/{month}:
 *   get:
 *     summary: Render the stats dashboard
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: The specified year
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: The specified month
 *     responses:
 *       200:
 *         description: Stats dashboard rendered successfully
 *       400:
 *         description: Invalid year or month
 *       500:
 *         description: Error rendering stats dashboard
 */
const renderStatsDashboard = async (req, res, next) => {
    try {
        // Fetch the specified year and month from the URL parameters
        const specifiedYear = parseInt(req.params.year);
        const specifiedMonth = parseInt(req.params.month);

        // Ensure valid values for year and month
        if (isNaN(specifiedYear) || isNaN(specifiedMonth) || specifiedMonth < 1 || specifiedMonth > 12) {
            return res.status(400).send('Invalid year or month.');
        }

        // Fetch all subcontractors and invoices
        const subcontractors = await db.Subcontractors.findAll({ order: [['company', 'ASC']] });
        const invoices = await db.Invoices.findAll({ order: [['kashflowNumber', 'ASC']] });

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

            subcontractorTotals[invoice.subcontractorId].grossTotal = subcontractorTotals[invoice.subcontractorId].grossTotal + invoice.grossAmount, false;
            subcontractorTotals[invoice.subcontractorId].materialTotal = subcontractorTotals[invoice.subcontractorId].materialTotal + invoice.materialCost, false;
            subcontractorTotals[invoice.subcontractorId].cisTotal = subcontractorTotals[invoice.subcontractorId].cisTotal + invoice.cisAmount, false;

            if (invoice.reverseCharge) {
                subcontractorTotals[invoice.subcontractorId].reverseChargeTotal = subcontractorTotals[invoice.subcontractorId].reverseChargeTotal + invoice.reverseCharge, false;
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

        // Iterate through filteredInvoices and log problematic ones
        const invalidInvoices = filteredInvoices.filter((invoice) => {
            const isInvalid = !invoice.submissionDate || isNaN(new Date(invoice.submissionDate).getTime());
            if (isInvalid) {
                logger.info('Invalid Invoice:', invoice); // Log the full invoice object
            }
            return isInvalid;
        });

        if (invalidInvoices.length > 0) {
            logger.info(`Found ${invalidInvoices.length} invoice(s) with invalid submission dates:`);
            invalidInvoices.forEach((invoice) => {
                logger.info(`Invoice ID: ${invoice.id}, Submission Date: ${invoice.submissionDate}`);
            });
        } else {
            logger.info('All submission dates are valid.');
        }

        logger.info(submissionDate);
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
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/user:
 *   get:
 *     summary: Render the user dashboard
 *     responses:
 *       200:
 *         description: User dashboard rendered successfully
 *       500:
 *         description: Error rendering user dashboard
 */
const renderUserDashboard = async (req, res, next) => {
    try {
        const users = await db.Users.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'usersDashboard'), {
            title: 'Users',
            users,
            
            

        });
    } catch (error) {
        logger.error('Error rendering users dashboard: ' + error.message);
        req.flash('error', 'Error rendering users dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/invoice:
 *   get:
 *     summary: Render the invoice dashboard
 *     responses:
 *       200:
 *         description: Invoice dashboard rendered successfully
 *       500:
 *         description: Error rendering invoice dashboard
 */
const renderInvoiceDashboard = async (req, res, next) => {
    try {
        const invoices = await db.Invoices.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'invoicesDashboard'), {
            title: 'Invoices',
            invoices,
            
            

        });
    } catch (error) {
        logger.error('Error rendering invoices dashboard:' + error.message);
        req.flash('error', 'Error rendering invoices dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/subcontractor:
 *   get:
 *     summary: Render the subcontractor dashboard
 *     responses:
 *       200:
 *         description: Subcontractor dashboard rendered successfully
 *       500:
 *         description: Error rendering subcontractor dashboard
 */
const renderSubcontractorDashboard = async (req, res, next) => {
    try {
        const subcontractors = await db.Subcontractors.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'subcontractorsDashboard'), {
            title: 'Subcontractors',
            subcontractors,
            
            

        });
    } catch (error) {
        logger.error('Error rendering subcontractors dashboard:' + error.message);
        req.flash('error', 'Error rendering subcontractors dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/quote:
 *   get:
 *     summary: Render the quotes dashboard
 *     responses:
 *       200:
 *         description: Quotes dashboard rendered successfully
 *       500:
 *         description: Error rendering quotes dashboard
 */
const renderQuotesDashboard = async (req, res, next) => {
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
        next(error); // Pass the error to the error handler
    }
};


/**
 * @swagger
 * /dashboard/client:
 *   get:
 *     summary: Render the clients dashboard
 *     responses:
 *       200:
 *         description: Clients dashboard rendered successfully
 *       500:
 *         description: Error rendering clients dashboard
 */
const renderClientsDashboard = async (req, res, next) => {
    try {
        const clients = await db.Clients.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'clientsDashboard'), {
            title: 'Clients',
            clients,
        });
    } catch (error) {
        logger.error('Error rendering clients dashboard:' + error.message);
        req.flash('error', 'Error rendering clients dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/contact:
 *   get:
 *     summary: Render the contacts dashboard
 *     responses:
 *       200:
 *         description: Contacts dashboard rendered successfully
 *       500:
 *         description: Error rendering contacts dashboard
 */
const renderContactsDashboard = async (req, res, next) => {
    try {
        const contacts = await db.Contacts.findAll({ order: [['createdAt', 'DESC']], include: [db.Clients] });

        res.render(path.join('dashboards', 'contactsDashboard'), {
            title: 'Contacts',
            contacts,
        });
    } catch (error) {
        logger.error('Error rendering contacts dashboard:' + error.message);
        req.flash('error', 'Error rendering contacts dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/job:
 *   get:
 *     summary: Render the jobs dashboard
 *     responses:
 *       200:
 *         description: Jobs dashboard rendered successfully
 *       500:
 *         description: Error rendering jobs dashboard
 */
const renderJobsDashboard = async (req, res, next) => {
    try {
        // Fetch jobs with a non-empty job_ref
        const jobs = await db.Jobs.findAll({
            where: {
                job_ref: {
                    [db.Sequelize.Op.ne]: ""
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
        next(error); // Pass the error to the error handler
    }
};

// Read all locations
/**
 * @swagger
 * /dashboard/location:
 *   get:
 *     summary: Render the locations dashboard
 *     responses:
 *       200:
 *         description: Locations dashboard rendered successfully
 *       500:
 *         description: Error rendering locations dashboard
 */
const renderLocationsDashboard = async (req, res, next) => {
    try {
        const locations = await db.Locations.findAll({ order: [['createdAt', 'DESC']] });

        res.render(path.join('dashboards', 'locationsDashboard'), {
            title: 'Locations',
            locations,
        });
    } catch (error) {
        logger.error('Error rendering locations dashboard: ' + error.message);
        req.flash('error', 'Error rendering locations dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/attendance:
 *   get:
 *     summary: Render the attendance dashboard
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: The date of attendance
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: The ID of the employee
 *       - in: query
 *         name: subcontractorId
 *         schema:
 *           type: integer
 *         description: The ID of the subcontractor
 *     responses:
 *       200:
 *         description: Attendance dashboard rendered successfully
 *       500:
 *         description: Error rendering attendance dashboard
 */
const renderAttendanceDashboard = async (req, res, next) => {
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
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/employee:
 *   get:
 *     summary: Render the employee dashboard
 *     responses:
 *       200:
 *         description: Employee dashboard rendered successfully
 *       500:
 *         description: Error rendering employee dashboard
 */
const renderEmployeeDashboard = async (req, res, next) => {
    try {
        // Fetch all employees from the database
        const employees = await db.Employees.findAll();

        // Calculate the total number of employees
        const totalEmployees = employees.length;

        // Render the dashboard view, passing in the employee data
        res.render(path.join('dashboards', 'employeeDashboard'), {
            employees,
            totalEmployees,
            
        });
    } catch (error) {
        logger.error('Error rendering employee dashboard: ' + error.message);
        req.flash('error', 'Error rendering employee dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/KFinvoice:
 *   get:
 *     summary: Render the KashFlow invoices dashboard
 *     responses:
 *       200:
 *         description: KashFlow invoices dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow invoices dashboard
 */
const renderKFInvoicesDashboard = async (req, res, next) => {
    try {
        const invoices = await kf.KF_Invoices.findAll({
            order: [['InvoiceDBID', 'DESC']]
        });

        const paidInvoicesCount = invoices.filter(invoice => invoice.AmountPaid >= invoice.NetAmount).length;
        const unpaidInvoicesCount = invoices.length - paidInvoicesCount;

        res.render(path.join('kashflow', 'invoice'), {
            title: 'Invoices Dashboard',
            invoices,
            paidInvoicesCount,
            unpaidInvoicesCount,
        });

    } catch (error) {
        logger.error('Error rendering KFInvoices dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFInvoices dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/KFcustomer:
 *   get:
 *     summary: Render the KashFlow customers dashboard
 *     responses:
 *       200:
 *         description: KashFlow customers dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow customers dashboard
 */
const renderKFCustomersDashboard = async (req, res, next) => {
    try {
        const customers = await kf.KF_Customers.findAll({
            order: [['Created', 'DESC']],
        });

        const totalCustomers = customers.length;
        const newCustomersCount = customers.filter(customer => {
            const createdDate = new Date(customer.Created);
            const now = new Date();
            return now - createdDate <= 30 * 24 * 60 * 60 * 1000; // Customers created in the last 30 days
        }).length;
        const discountedCustomersCount = customers.filter(customer => customer.Discount > 0).length;

        const recentCustomers = customers.slice(0, 5);

        res.render(path.join('kashflow', 'customer'), {
            title: 'Customers Dashboard',
            customers,
            totalCustomers,
            newCustomersCount,
            discountedCustomersCount,
            recentCustomers,
        });
    } catch (error) {
        logger.error('Error rendering KFCustomers dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFCustomers dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/KFproject:
 *   get:
 *     summary: Render the KashFlow projects dashboard
 *     responses:
 *       200:
 *         description: KashFlow projects dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow projects dashboard
 */
const renderKFProjectsDashboard = async (req, res, next) => {
    try {
        const projects = await kf.KF_Projects.findAll({
            order: [['Number', 'DESC']]
        });

        const activeProjects = projects.filter(project => project.Status === 1);
        const archivedProjects = projects.filter(project => project.Status === 2);
        const completedProjects = projects.filter(project => project.Status === 0);

        res.render(path.join('kashflow', 'project'), {
            title: 'Projects Dashboard',
            activeProjects,
            archivedProjects,
            completedProjects,
        });
    } catch (error) {
        logger.error('Error rendering KFProjects dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFProjects dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/KFquote:
 *   get:
 *     summary: Render the KashFlow quotes dashboard
 *     responses:
 *       200:
 *         description: KashFlow quotes dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow quotes dashboard
 */
const renderKFQuotesDashboard = async (req, res, next) => {
    try {
        const quotes = await kf.KF_Quotes.findAll({
            order: [['InvoiceDBID', 'DESC']]
        });

        res.render(path.join('kashflow', 'quote'), {
            title: 'Quotes Dashboard',
            quotes,
        });
    } catch (error) {
        logger.error('Error rendering KFQuotes dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFQuotes dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/KFreceipt:
 *   get:
 *     summary: Render the KashFlow receipts dashboard
 *     responses:
 *       200:
 *         description: KashFlow receipts dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow receipts dashboard
 */
const renderKFReceiptsDashboard = async (req, res, next) => {
    try {
        const receipts = await kf.KF_Receipts.findAll({
            order: [['InvoiceDBID', 'DESC']],
            limit: 50,
            include: [{ model: kf.KF_Suppliers, as: 'supplier' }],
        });

        // Add total calculation for each receipt
        const receiptsWithTotals = receipts.map(receipt => ({
            ...receipt.toJSON(), // Convert Sequelize instance to plain object
            calcTotal: parseFloat(receipt.NetAmount) + parseFloat(receipt.VATAmount), // Calculate the total
        }));

        res.render(path.join('kashflow', 'receipt'), {
            title: 'Purchases Dashboard',
            receipts: receiptsWithTotals,
        });
    } catch (error) {
        logger.error('Error rendering KFReceipts dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFReceipts dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/KFsupplier:
 *   get:
 *     summary: Render the KashFlow suppliers dashboard
 *     responses:
 *       200:
 *         description: KashFlow suppliers dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow suppliers dashboard
 */
const renderKFSuppliersDashboard = async (req, res, next) => {
    try {
        const suppliers = await kf.KF_Suppliers.findAll({
            order: [['Created', 'DESC']]
        });

        const totalSuppliers = suppliers.length;

        const suppliersWithContact = suppliers.filter(
            (supplier) => supplier.Email || supplier.Telephone
        ).length;

        const recentSuppliers = suppliers.filter(
            (supplier) => new Date(supplier.Created) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length;

        res.render(path.join('kashflow', 'supplier'), {
            title: 'Suppliers Dashboard',
            suppliers,
            totalSuppliers,
            suppliersWithContact,
            recentSuppliers
        });
    } catch (error) {
        logger.error('Error rendering KFSuppliers dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFSuppliers dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

/**
 * @swagger
 * /dashboard/KF:
 *   get:
 *     summary: Render the KashFlow dashboard
 *     responses:
 *       200:
 *         description: KashFlow dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow dashboard
 */
const renderKashflowDashboard = async (req, res, next) => {
    try {
        // Fetch all necessary data
        const totalCustomers = await kf.KF_Customers.count();
        const totalInvoices = await kf.KF_Invoices.count();
        const totalReceipts = await kf.KF_Receipts.count();
        const totalQuotes = await kf.KF_Quotes.count();
        const totalSuppliers = await kf.KF_Suppliers.count();
        const totalProjects = await kf.KF_Projects.count();


        const incomeExpenseData = await currencyService.getIncomeExpenseData(kf);

        // Calculate paid/unpaid invoices
        const paidInvoices = await kf.KF_Invoices.count({ where: { Paid: { [kf.Sequelize.Op.gt]: 0 } } });
        const unpaidInvoices = totalInvoices - paidInvoices;

        // Get top customers by revenue
        const topCustomersData = await kf.KF_Invoices.findAll({
            attributes: ['CustomerName', [kf.Sequelize.fn('SUM', kf.Sequelize.col('NetAmount')), 'totalRevenue']],
            group: ['CustomerName'],
            order: [[kf.Sequelize.literal('totalRevenue'), 'DESC']],
            limit: 5,
        });

        const topCustomers = {
            names: topCustomersData.map((customer) => customer.CustomerName),
            revenue: topCustomersData.map((customer) => parseFloat(customer.get('totalRevenue'))),
        };

        // Render the dashboard
        res.render(path.join('kashflow', 'dashboard'), {
            title: 'KashFlow Dashboard',
            totalCustomers,
            totalInvoices,
            totalReceipts,
            totalQuotes,
            totalSuppliers,
            totalProjects,
            incomeExpenseData,
            paidInvoices,
            unpaidInvoices,
            topCustomers,
        });
    } catch (error) {
        logger.error('Error rendering KashFlow dashboard: ' + error.message);
        req.flash('error', 'Error rendering dashboard.');
        next(error); // Pass the error to the error handler
    }
};

router.get('/stats', authService.ensureAuthenticated, authService.ensureRole('admin'), (req, res) => {
    try {
        const { taxYear, taxMonth } = taxService.calculateTaxYearAndMonth(moment());
        logger.info(`Tax Year: ${taxYear}, Tax Month: ${taxMonth}`);
        return res.redirect(`/dashboard/stats/${taxYear}/${taxMonth}`);
    } catch (error) {
        logger.error('Error rendering stats dashboard:' + error.message);
        req.flash('error', 'Error rendering stats dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
});
/**
 * @swagger
 * /dashboard/stats/{year}/{month}:
 *   get:
 *     summary: Render the stats dashboard
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: The specified year
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: The specified month
 *     responses:
 *       200:
 *         description: Stats dashboard rendered successfully
 *       400:
 *         description: Invalid year or month
 *       500:
 *         description: Error rendering stats dashboard
 */
router.get('/stats/:year?/:month?', authService.ensureAuthenticated, authService.ensureRole('admin'), renderStatsDashboard);

/**
 * @swagger
 * /dashboard/user:
 *   get:
 *     summary: Render the user dashboard
 *     responses:
 *       200:
 *         description: User dashboard rendered successfully
 *       500:
 *         description: Error rendering user dashboard
 */
router.get('/user', authService.ensureAuthenticated, authService.ensureRole('admin'), renderUserDashboard);

/**
 * @swagger
 * /dashboard/subcontractor:
 *   get:
 *     summary: Render the subcontractor dashboard
 *     responses:
 *       200:
 *         description: Subcontractor dashboard rendered successfully
 *       500:
 *         description: Error rendering subcontractor dashboard
 */
router.get('/subcontractor', authService.ensureAuthenticated, authService.ensureRole('admin'), renderSubcontractorDashboard);

/**
 * @swagger
 * /dashboard/invoice:
 *   get:
 *     summary: Render the invoice dashboard
 *     responses:
 *       200:
 *         description: Invoice dashboard rendered successfully
 *       500:
 *         description: Error rendering invoice dashboard
 */
router.get('/invoice', authService.ensureAuthenticated, authService.ensureRole('admin'), renderInvoiceDashboard);

/**
 * @swagger
 * /dashboard/quote:
 *   get:
 *     summary: Render the quotes dashboard
 *     responses:
 *       200:
 *         description: Quotes dashboard rendered successfully
 *       500:
 *         description: Error rendering quotes dashboard
 */
router.get('/quote', authService.ensureAuthenticated, authService.ensureRole('admin'), renderQuotesDashboard);

/**
 * @swagger
 * /dashboard/client:
 *   get:
 *     summary: Render the clients dashboard
 *     responses:
 *       200:
 *         description: Clients dashboard rendered successfully
 *       500:
 *         description: Error rendering clients dashboard
 */
router.get('/client', authService.ensureAuthenticated, authService.ensureRole('admin'), renderClientsDashboard);

/**
 * @swagger
 * /dashboard/contact:
 *   get:
 *     summary: Render the contacts dashboard
 *     responses:
 *       200:
 *         description: Contacts dashboard rendered successfully
 *       500:
 *         description: Error rendering contacts dashboard
 */
router.get('/contact', authService.ensureAuthenticated, authService.ensureRole('admin'), renderContactsDashboard);

/**
 * @swagger
 * /dashboard/job:
 *   get:
 *     summary: Render the jobs dashboard
 *     responses:
 *       200:
 *         description: Jobs dashboard rendered successfully
 *       500:
 *         description: Error rendering jobs dashboard
 */
router.get('/job', authService.ensureAuthenticated, authService.ensureRole('admin'), renderJobsDashboard);
//router.get('/archive', authService.ensureAuthenticated, authService.ensureRole('admin'), renderQuoteArchiveDashboard);
/**
 * @swagger
 * /dashboard/location:
 *   get:
 *     summary: Render the locations dashboard
 *     responses:
 *       200:
 *         description: Locations dashboard rendered successfully
 *       500:
 *         description: Error rendering locations dashboard
 */
router.get('/location', authService.ensureAuthenticated, authService.ensureRole('admin'), renderLocationsDashboard);

/**
 * @swagger
 * /dashboard/attendance:
 *   get:
 *     summary: Render the attendance dashboard
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: The date of attendance
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: The ID of the employee
 *       - in: query
 *         name: subcontractorId
 *         schema:
 *           type: integer
 *         description: The ID of the subcontractor
 *     responses:
 *       200:
 *         description: Attendance dashboard rendered successfully
 *       500:
 *         description: Error rendering attendance dashboard
 */
router.get('/attendance', authService.ensureAuthenticated, authService.ensureRole('admin'), renderAttendanceDashboard);

/**
 * @swagger
 * /dashboard/employee:
 *   get:
 *     summary: Render the employee dashboard
 *     responses:
 *       200:
 *         description: Employee dashboard rendered successfully
 *       500:
 *         description: Error rendering employee dashboard
 */
router.get('/employee', authService.ensureAuthenticated, authService.ensureRole('admin'), renderEmployeeDashboard);

/**
 * @swagger
 * /dashboard/KFcustomer:
 *   get:
 *     summary: Render the KashFlow customers dashboard
 *     responses:
 *       200:
 *         description: KashFlow customers dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow customers dashboard
 */
router.get('/KFcustomer', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFCustomersDashboard);

/**
 * @swagger
 * /dashboard/KFinvoice:
 *   get:
 *     summary: Render the KashFlow invoices dashboard
 *     responses:
 *       200:
 *         description: KashFlow invoices dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow invoices dashboard
 */
router.get('/KFinvoice', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFInvoicesDashboard);

/**
 * @swagger
 * /dashboard/KFquote:
 *   get:
 *     summary: Render the KashFlow quotes dashboard
 *     responses:
 *       200:
 *         description: KashFlow quotes dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow quotes dashboard
 */
router.get('/KFquote', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFQuotesDashboard);

/**
 * @swagger
 * /dashboard/KFsupplier:
 *   get:
 *     summary: Render the KashFlow suppliers dashboard
 *     responses:
 *       200:
 *         description: KashFlow suppliers dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow suppliers dashboard
 */
router.get('/KFsupplier', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFSuppliersDashboard);

/**
 * @swagger
 * /dashboard/KFreceipt:
 *   get:
 *     summary: Render the KashFlow receipts dashboard
 *     responses:
 *       200:
 *         description: KashFlow receipts dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow receipts dashboard
 */
router.get('/KFreceipt', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFReceiptsDashboard);

/**
 * @swagger
 * /dashboard/KFproject:
 *   get:
 *     summary: Render the KashFlow projects dashboard
 *     responses:
 *       200:
 *         description: KashFlow projects dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow projects dashboard
 */
router.get('/KFproject', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFProjectsDashboard);

/**
 * @swagger
 * /dashboard/KF:
 *   get:
 *     summary: Render the KashFlow dashboard
 *     responses:
 *       200:
 *         description: KashFlow dashboard rendered successfully
 *       500:
 *         description: Error rendering KashFlow dashboard
 */
router.get('/KF', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKashflowDashboard);

/**
 * @swagger
 * /dashboard/CIS:
 *   get:
 *     summary: Redirect to the current CIS submission dashboard
 *     responses:
 *       302:
 *         description: Redirect to the current CIS submission dashboard
 *       500:
 *         description: Error rendering CIS submission dashboard
 */
router.get('/CIS', authService.ensureAuthenticated, authService.ensureRole('admin'), (req, res) => {
    try {
        const { taxYear, taxMonth } = taxService.calculateTaxYearAndMonth(moment());
        logger.info(`Tax Year: ${taxYear}, Tax Month: ${taxMonth}`);
        return res.redirect(`/dashboard/CIS/${taxYear}/${taxMonth}`);
    } catch (error) {
        logger.error('Error rendering stats dashboard:' + error.message);
        req.flash('error', 'Error rendering stats dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
});

/**
 * @swagger
 * /dashboard/CIS/{year}/{month}:
 *   get:
 *     summary: Render the CIS submission dashboard
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: The specified year
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: The specified month
 *     responses:
 *       200:
 *         description: CIS submission dashboard rendered successfully
 *       400:
 *         description: Invalid year or month
 *       500:
 *         description: Error rendering CIS submission dashboard
 */
router.get('/CIS/:year?/:month?', authService.ensureAuthenticated, authService.ensureRole('admin'), renderCISSubmissionDashboard);

module.exports = router;