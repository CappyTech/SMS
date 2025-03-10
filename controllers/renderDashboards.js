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

const renderKFInvoicesDashboard = async (req, res, next) => {
    try {
        const invoices = await kf.KF_Invoices.findAll({
            include: [
                {
                    model: kf.KF_Customers,
                    as: 'customer' // Ensure this matches the Sequelize association
                }
            ],
            order: [['InvoiceDate', 'DESC']]
        });

        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.Paid > 0).length;

        // Filter invoices from the last 30 days
        const recentInvoices = invoices.filter(inv =>
            new Date(inv.InvoiceDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        res.render(path.join('kashflow', 'invoice'), {
            title: 'Invoices Dashboard',
            invoices,
            totalInvoices,
            paidInvoices,
            recentInvoices
        });

    } catch (error) {
        logger.error('Error rendering KFInvoices dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFInvoices dashboard: ' + error.message);
        next(error);
    }
};


const renderKFCustomersDashboard = async (req, res, next) => {
    try {
        const customers = await kf.KF_Customers.findAll({ order: [['Name', 'ASC']] });
        const totalCustomers = customers.length;
        const customersWithEmail = customers.filter(c => c.Email).length;
        const recentCustomers = customers.filter(c => new Date(c.Created) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const recentCustomersCount = recentCustomers.length;

        res.render(path.join('kashflow', 'customer'), {
            title: 'Customers Dashboard',
            customers,
            totalCustomers,
            customersWithEmail,
            recentCustomers,
            recentCustomersCount
        });
    } catch (error) {
        logger.error('Error rendering KFCustomers dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFCustomers dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

const renderKFProjectsDashboard = async (req, res, next) => {
    try {
        const projects = await kf.KF_Projects.findAll({
            order: [['Number', 'DESC']]
        });

        const activeProjects = projects.filter(project => project.Status === 1);
        const archivedProjects = projects.filter(project => project.Status === 2);
        const completedProjects = projects.filter(project => project.Status === 0);

        res.render(path.join('kashflow', 'project'), {
            title: 'Jobs Dashboard',
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

const renderKFQuotesDashboard = async (req, res, next) => {
    try {
        const quotes = await kf.KF_Quotes.findAll({
            include: [
                {
                    model: kf.KF_Customers,
                    as: 'customer'
                }
            ],
            order: [['InvoiceNumber', 'DESC']]
        });
        const totalQuotes = quotes.length;
        const recentQuotes = quotes.filter(q => new Date(q.InvoiceDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

        res.render(path.join('kashflow', 'quote'), {
            title: 'Quotes Dashboard',
            quotes,
            totalQuotes,
            recentQuotes
        });
    } catch (error) {
        logger.error('Error rendering KFQuotes dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFQuotes dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

const renderKFReceiptsDashboard = async (req, res, next) => {
    try {
        const receipts = await kf.KF_Receipts.findAll({
            include: [
                {
                    model: kf.KF_Suppliers,
                    as: 'supplier'
                }
            ],
        });
        const totalReceipts = receipts.length;

        // Filter recent receipts (last 30 days)
        const recentReceipts = receipts.filter(receipt => 
            new Date(receipt.InvoiceDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        res.render(path.join('kashflow', 'receipt'), {
            title: 'Purchases Dashboard',
            receipts,
            totalReceipts,
            recentReceipts
        });
    } catch (error) {
        logger.error('Error rendering KFReceipts dashboard: ' + error.message);
        req.flash('error', 'Error rendering KFReceipts dashboard: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

const renderKFSuppliersDashboard = async (req, res, next) => {
    try {
        const suppliers = await kf.KF_Suppliers.findAll({
            order: [['Name', 'ASC']]
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

const renderKashflowDashboard = async (req, res, next) => {
    try {
        // Fetch all necessary data
        const [
            totalCustomers,
            totalReceipts,
            totalQuotes,
            totalSuppliers,
            totalProjects
        ] = await Promise.all([
            kf.KF_Customers.count(),
            kf.KF_Receipts.count(),
            kf.KF_Quotes.count(),
            kf.KF_Suppliers.count(),
            kf.KF_Projects.count(),
        ]);
        
        const incomeExpenseData = await currencyService.getIncomeExpenseData(kf);

        const invoiceAgingData = await kf.KF_Invoices.findAll({
            attributes: [
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN DATEDIFF(NOW(), DueDate) BETWEEN 1 AND 30 THEN 1 END')), 'overdue_1_30'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN DATEDIFF(NOW(), DueDate) BETWEEN 31 AND 60 THEN 1 END')), 'overdue_31_60'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN DATEDIFF(NOW(), DueDate) > 60 THEN 1 END')), 'overdue_60_plus'],
            ],
        });        

        const summaryData = await kf.KF_Invoices.findAll({
            attributes: [
                [kf.Sequelize.fn('COUNT', kf.Sequelize.col('InvoiceDBID')), 'totalInvoices'],
                [kf.Sequelize.fn('SUM', kf.Sequelize.col('NetAmount')), 'totalRevenue'],
                [kf.Sequelize.fn('SUM', kf.Sequelize.col('Paid')), 'totalPaidAmount'],
                [kf.Sequelize.fn('SUM', kf.Sequelize.literal('NetAmount - Paid')), 'totalUnpaidAmount'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN Paid = NetAmount THEN 1 END')), 'fullyPaidInvoices'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN Paid > 0 AND Paid < NetAmount THEN 1 END')), 'partiallyPaidInvoices'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN Paid = 0 THEN 1 END')), 'unpaidInvoices'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN DueDate < NOW() AND Paid < NetAmount THEN 1 END')), 'overdueInvoices'],
            ],
        });

        const avgInvoiceValue = summaryData[0].totalRevenue / (summaryData[0].totalInvoices || 1);
        const invoiceAging = invoiceAgingData[0] || {}; // Avoids undefined errors

        // Get top customers by revenue
        const topCustomersData = await kf.KF_Invoices.findAll({
            attributes: ['CustomerName', [kf.Sequelize.fn('SUM', kf.Sequelize.col('NetAmount')), 'totalRevenue']],
            group: ['CustomerName'],
            order: [[kf.Sequelize.literal('totalRevenue'), 'DESC']],
            limit: 10,
        });

        const topCustomers = {
            names: topCustomersData.map((customer) => customer.CustomerName),
            revenue: topCustomersData.map((customer) => parseFloat(customer.get('totalRevenue'))),
        };

        const paymentSpeedData = await kf.KF_Invoices.findAll({
            attributes: [
                [kf.Sequelize.fn('AVG', kf.Sequelize.literal('DATEDIFF(PaymentDate, InvoiceDate)')), 'avgPaymentTime'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN DATEDIFF(PaymentDate, InvoiceDate) <= 30 THEN 1 END')), 'paidWithin30Days'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN DATEDIFF(PaymentDate, InvoiceDate) BETWEEN 31 AND 60 THEN 1 END')), 'paidWithin31to60Days'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('CASE WHEN DATEDIFF(PaymentDate, InvoiceDate) > 60 THEN 1 END')), 'paidAfter60Days'],
            ],
        });
        /*
        Show average days to payment.
        Breakdown of customers who pay within 30, 60, or 60+ days.
        */
        
        const supplierExpenses = await kf.KF_Receipts.findAll({
            attributes: [
                'SupplierName',
                [kf.Sequelize.fn('SUM', kf.Sequelize.col('Amount')), 'totalSpent'],
            ],
            group: ['SupplierName'],
            order: [[kf.Sequelize.literal('totalSpent'), 'DESC']],
            limit: 10, // Show top 10 suppliers
        });
        // Pie chart of top suppliers by amount spent.
        
        const customerRetentionData = await kf.KF_Invoices.findAll({
            attributes: [
                [kf.Sequelize.fn('COUNT', kf.Sequelize.col('CustomerID')), 'totalCustomers'],
                [kf.Sequelize.fn('COUNT', kf.Sequelize.literal('DISTINCT CustomerID')), 'uniqueCustomers'],
            ],
        });
        
        const repeatCustomerRate = ((customerRetentionData[0].totalCustomers - customerRetentionData[0].uniqueCustomers) / customerRetentionData[0].totalCustomers) * 100;


        // Render the dashboard
        res.render(path.join('kashflow', 'dashboard'), {
            title: 'KashFlow Dashboard',
            totalCustomers,
            totalInvoices: summaryData[0].totalInvoices,
            totalReceipts,
            totalQuotes,
            totalSuppliers,
            totalProjects,
            totalRevenue: summaryData[0].totalRevenue,

            incomeExpenseData,

            fullyPaidInvoices: summaryData[0].fullyPaidInvoices,
            partiallyPaidInvoices: summaryData[0].partiallyPaidInvoices,
            unpaidInvoices: summaryData[0].unpaidInvoices,
            overdueInvoices: summaryData[0].overdueInvoices,

            topCustomers,

            avgInvoiceValue,
            invoiceAging,

            repeatCustomerRate,
            supplierExpenses,
            paymentSpeedData,
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
router.get('/stats/:year?/:month?', authService.ensureAuthenticated, authService.ensureRole('admin'), renderStatsDashboard);
router.get('/user', authService.ensureAuthenticated, authService.ensureRole('admin'), renderUserDashboard);
router.get('/subcontractor', authService.ensureAuthenticated, authService.ensureRole('admin'), renderSubcontractorDashboard);
router.get('/invoice', authService.ensureAuthenticated, authService.ensureRole('admin'), renderInvoiceDashboard);
router.get('/quote', authService.ensureAuthenticated, authService.ensureRole('admin'), renderQuotesDashboard);
router.get('/client', authService.ensureAuthenticated, authService.ensureRole('admin'), renderClientsDashboard);
router.get('/contact', authService.ensureAuthenticated, authService.ensureRole('admin'), renderContactsDashboard);
router.get('/job', authService.ensureAuthenticated, authService.ensureRole('admin'), renderJobsDashboard);
//router.get('/archive', authService.ensureAuthenticated, authService.ensureRole('admin'), renderQuoteArchiveDashboard);
router.get('/location', authService.ensureAuthenticated, authService.ensureRole('admin'), renderLocationsDashboard);
router.get('/attendance', authService.ensureAuthenticated, authService.ensureRole('admin'), renderAttendanceDashboard);
router.get('/employee', authService.ensureAuthenticated, authService.ensureRole('admin'), renderEmployeeDashboard);

router.get('/KFcustomer', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFCustomersDashboard);
router.get('/KFinvoice', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFInvoicesDashboard);
router.get('/KFquote', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFQuotesDashboard);
router.get('/KFsupplier', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFSuppliersDashboard);
router.get('/KFreceipt', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFReceiptsDashboard);
router.get('/KFproject', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFProjectsDashboard);
router.get('/KF', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKashflowDashboard);

const renderCISSubmissionDashboard = async (req, res, next) => {
    try {
        // Fetch the specified year and month from the URL parameters
        const specifiedYear = parseInt(req.params.year);
        const specifiedMonth = parseInt(req.params.month);

        // Ensure valid values for year and month
        if (isNaN(specifiedYear) || isNaN(specifiedMonth) || specifiedMonth < 1 || specifiedMonth > 12) {
            return res.status(400).send('Invalid year or month.');
        }

        const suppliers = await kf.KF_Suppliers.findAll({
            order: [['Name', 'ASC']]
        });
        const receipts = await kf.KF_Receipts.findAll({
            order: [['InvoiceNumber', 'ASC']]
        });

        const taxYear = taxService.getTaxYearStartEnd(specifiedYear);
        const currentMonthlyReturn = taxService.getCurrentMonthlyReturn(specifiedYear, specifiedMonth);
        // Log one of the receipts in full, JSON Parse
        if (receipts.length > 0) {
            const receiptToLog = receipts[0];
            const parsedReceipt = typeof receiptToLog.Lines === 'string' ? JSON.parse(receiptToLog.Lines) : receiptToLog.Lines;
            const parsedPayments = typeof receiptToLog.Payments === 'string' ? JSON.parse(receiptToLog.Payments) : receiptToLog.Payments;
            logger.info('Receipt:'+ JSON.stringify({ ...receiptToLog.toJSON(), Lines: parsedReceipt, Payments: parsedPayments }, null, 2));
        }
        // Filter receipts based on the CIS period using PayDate
        const filteredReceipts = receipts.filter(receipt => {
            if (!receipt.Payments) return false;

            // Parse Payments if it's a string
            const parsedPayments = typeof receipt.Payments === 'string' ? JSON.parse(receipt.Payments) : receipt.Payments;

            // Extract the PayDate from the Payments
            const payment = parsedPayments.Payment?.Payment?.[0];
            if (!payment || !payment.PayDate) return false;

            const payDate = moment(payment.PayDate);
            return payDate.isBetween(
                currentMonthlyReturn.periodStart,
                currentMonthlyReturn.periodEnd,
                null,
                '[]'
            );
        });

        // Further filter receipts to include only those with both Labour Costs and CIS Deductions
        const receiptsWithLabourAndCIS = filteredReceipts.filter(receipt => {
            const lines = typeof receipt.Lines === 'string' ? JSON.parse(receipt.Lines) : receipt.Lines;

            const hasLabourCost = lines.some(line => line.ChargeType === 18685897); // Labour Costs
            const hasCISDeductions = lines.some(line => line.ChargeType === 18685964); // CIS Deductions

            return hasLabourCost && hasCISDeductions;
        });

        // Extract unique supplier IDs from the filtered receipts
        const SupplierIDs = [...new Set(receiptsWithLabourAndCIS.map(receipt => receipt.CustomerID))];

        // Filter suppliers based on IDs
        const filteredSuppliers = suppliers.filter(supplier => SupplierIDs.includes(supplier.SupplierID));

        // Calculate totals for the filtered receipts
        const supplierTotals = {};
        receiptsWithLabourAndCIS.forEach(receipt => {
            const customerId = String(receipt.CustomerID);

            if (!supplierTotals[customerId]) {
                supplierTotals[customerId] = {
                    grossAmount: 0,
                    materialsCost: 0,
                    cisDeductions: 0,
                    labourCost: 0,
                    reverseChargeVAT: 0,
                    reverseChargeNet: 0,
                };
            }

            const lines = typeof receipt.Lines === 'string' ? JSON.parse(receipt.Lines) : receipt.Lines;

            lines.forEach(line => {
                if (line.ChargeType === 18685896) { // Materials
                    supplierTotals[customerId].materialsCost += parseFloat(line.Rate * line.Quantity || 0);
                } else if (line.ChargeType === 18685897) { // Labour
                    supplierTotals[customerId].labourCost += parseFloat(line.Rate * line.Quantity || 0);
                } else if (line.ChargeType === 18685964) { // CIS Deductions
                    supplierTotals[customerId].cisDeductions += parseFloat(line.Rate * line.Quantity || 0);
                }
            });

            supplierTotals[customerId].reverseChargeVAT += parseFloat(receipt.CISRCVatAmount || 0);
            supplierTotals[customerId].reverseChargeNet += parseFloat(receipt.CISRCNetAmount || 0);

            supplierTotals[customerId].grossAmount =
                supplierTotals[customerId].materialsCost + supplierTotals[customerId].labourCost;
        });

        const allReceiptsSubmitted = receiptsWithLabourAndCIS.every(
            receipt => receipt.submissionDate && receipt.submissionDate !== '0000-00-00 00:00:00'
        );
        const submissionDate =
            allReceiptsSubmitted && receiptsWithLabourAndCIS.length > 0
                ? receiptsWithLabourAndCIS[0].submissionDate
                : null;

        const previousMonth = specifiedMonth === 1 ? 12 : specifiedMonth - 1;
        const previousYear = specifiedMonth === 1 ? specifiedYear - 1 : specifiedYear;
        const nextMonth = specifiedMonth === 12 ? 1 : specifiedMonth + 1;
        const nextYear = specifiedMonth === 12 ? specifiedYear + 1 : specifiedYear;

        const periodEnd = moment(currentMonthlyReturn.periodEndDisplay, 'Do MMMM YYYY');
        const submissionStartDate = periodEnd.clone().date(7).format('Do MMMM YYYY');
        const submissionEndDate = periodEnd.clone().date(11).format('Do MMMM YYYY');

        //logger.info('Supplier Totals: ' + JSON.stringify(supplierTotals, null, 2));

        res.render(path.join('kashflow', 'cisDashboard'), {
            title: 'CIS Submission Dashboard',
            supplierCount: filteredSuppliers.length,
            receiptCount: receiptsWithLabourAndCIS.length,
            suppliers: filteredSuppliers,
            receipts: receiptsWithLabourAndCIS,
            taxYear,
            taxMonth: specifiedMonth,
            allReceiptsSubmitted,
            submissionDate,
            supplierTotals,
            currentMonthlyReturn,
            previousYear,
            previousMonth,
            nextYear,
            nextMonth,
            submissionStartDate,
            submissionEndDate,
            specifiedYear,
            specifiedMonth,
        });
    } catch (error) {
        logger.error('Error rendering CIS submission dashboard: ' + error.message);
        req.flash('error', 'Error rendering CIS submission dashboard: ' + error.message);
        next(error);
    }
};

const renderCISDashboard = async (req, res, next) => {
    try {
        const specifiedYear = parseInt(req.params.year);
        const specifiedMonth = parseInt(req.params.month);

        if (isNaN(specifiedYear) || isNaN(specifiedMonth) || specifiedMonth < 1 || specifiedMonth > 12) {
            return res.status(400).send('Invalid year or month.');
        }

        const suppliers = await kf.KF_Suppliers.findAll({ order: [['Name', 'ASC']] });
        const receipts = await kf.KF_Receipts.findAll({ order: [['InvoiceNumber', 'ASC']] });

        // Parse receipts once and store the processed version
        const processedReceipts = receipts.map(receipt => ({
            ...receipt.toJSON(),
            Lines: typeof receipt.Lines === 'string' ? JSON.parse(receipt.Lines) : receipt.Lines,
            Payments: typeof receipt.Payments === 'string' ? JSON.parse(receipt.Payments) : receipt.Payments
        }));

        const taxYear = taxService.getTaxYearStartEnd(specifiedYear);
        const currentMonthlyReturn = taxService.getCurrentMonthlyReturn(specifiedYear, specifiedMonth);

        if (processedReceipts.length > 0) {
            logger.info('Receipt: '+ JSON.stringify(processedReceipts[0], null, 2));
        }

        const filteredReceipts = processedReceipts.filter(receipt => {
            if (!receipt.Payments) return false;

            const payment = receipt.Payments.Payment?.Payment?.[0];
            if (!payment || !payment.PayDate) return false;

            const payDate = moment.utc(payment.PayDate);
            return payDate.isBetween(currentMonthlyReturn.periodStart, currentMonthlyReturn.periodEnd, null, '[]');
        });

        const receiptsWithLabourAndCIS = filteredReceipts.filter(receipt => {
            const hasLabourAndCIS = receipt.Lines.reduce((acc, line) => {
                if (line.ChargeType === 18685897) acc.hasLabour = true;
                if (line.ChargeType === 18685964) acc.hasCIS = true;
                return acc;
            }, { hasLabour: false, hasCIS: false });

            return hasLabourAndCIS.hasLabour && hasLabourAndCIS.hasCIS;
        });

        const SupplierIDs = [...new Set(receiptsWithLabourAndCIS.map(receipt => receipt.CustomerID))];
        const supplierIDSet = new Set(SupplierIDs);
        const filteredSuppliers = suppliers.filter(supplier => supplierIDSet.has(supplier.SupplierID));

        const supplierTotals = {};
        receiptsWithLabourAndCIS.forEach(receipt => {
            const customerId = String(receipt.CustomerID);

            if (!supplierTotals[customerId]) {
                supplierTotals[customerId] = {
                    grossAmount: 0,
                    materialsCost: 0,
                    cisDeductions: 0,
                    labourCost: 0,
                    reverseChargeVAT: 0,
                    reverseChargeNet: 0,
                };
            }

            receipt.Lines.forEach(line => {
                if (line.ChargeType === 18685896) supplierTotals[customerId].materialsCost += parseFloat(line.Rate * line.Quantity || 0);
                if (line.ChargeType === 18685897) supplierTotals[customerId].labourCost += parseFloat(line.Rate * line.Quantity || 0);
                if (line.ChargeType === 18685964) supplierTotals[customerId].cisDeductions += parseFloat(line.Rate * line.Quantity || 0);
            });

            supplierTotals[customerId].reverseChargeVAT += parseFloat(receipt.CISRCVatAmount || 0);
            supplierTotals[customerId].reverseChargeNet += parseFloat(receipt.CISRCNetAmount || 0);
            supplierTotals[customerId].grossAmount = supplierTotals[customerId].materialsCost + supplierTotals[customerId].labourCost;
        });

        const allReceiptsSubmitted = receiptsWithLabourAndCIS.every(receipt => receipt.submissionDate && receipt.submissionDate !== '0000-00-00 00:00:00');
        const submissionDate = allReceiptsSubmitted && receiptsWithLabourAndCIS.length > 0 ? receiptsWithLabourAndCIS[0].submissionDate : null;

        const prevDate = moment({ year: specifiedYear, month: specifiedMonth - 2 });
        const nextDate = moment({ year: specifiedYear, month: specifiedMonth });
        
        const previousMonth = prevDate.month() + 1;
        const previousYear = prevDate.year();
        const nextMonth = nextDate.month() + 1;
        const nextYear = nextDate.year();

        const periodEnd = moment(currentMonthlyReturn.periodEndDisplay, 'Do MMMM YYYY');
        const submissionStartDate = periodEnd.clone().date(7).format('Do MMMM YYYY');
        const submissionEndDate = periodEnd.clone().date(11).format('Do MMMM YYYY');

        res.render(path.join('kashflow', 'cisDashboard'), {
            title: 'CIS Submission Dashboard',
            supplierCount: filteredSuppliers.length,
            receiptCount: receiptsWithLabourAndCIS.length,
            suppliers: filteredSuppliers,
            receipts: receiptsWithLabourAndCIS,
            taxYear,
            taxMonth: specifiedMonth,
            allReceiptsSubmitted,
            submissionDate,
            supplierTotals,
            currentMonthlyReturn,
            previousYear,
            previousMonth,
            nextYear,
            nextMonth,
            submissionStartDate,
            submissionEndDate,
            specifiedYear,
            specifiedMonth,
        });
    } catch (error) {
        logger.error(`Error rendering CIS submission dashboard: ${error.message}`, { stack: error.stack });
        req.flash('error', `Error rendering CIS submission dashboard: ${error.message}`);
        next(error);
    }
};


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

router.get('/CIS/:year?/:month?', authService.ensureAuthenticated, authService.ensureRole('admin'), renderCISDashboard);

module.exports = router;