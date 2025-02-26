const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const flash = require('express-flash');
const useragent = require('express-useragent');
const logger = require('./services/loggerService');
require('dotenv').config();
const packageJson = require('./package.json');
const moment = require('moment');
const app = express();
app.set('trust proxy', true);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/resources', express.static(path.join(__dirname, 'node_modules')));
app.use(useragent.express());

app.use(require('./services/securityService'));
app.use(require('./services/sessionService'));
app.use(flash());
app.use(require('./services/logRequestDetailsService'));
app.use(require('./services/rateLimiterService'));
app.use(require('./services/cronService'));
const db = require('./services/sequelizeDatabaseService');
const kf = require('./services/kashflowDatabaseService');

require('./swagger')(app);

app.use(async (req, res, next) => {
    res.locals.session = req.session;
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;
    res.locals.firstName = null;
    res.locals.permissions = {};
    res.locals.role = null;
    logger.debug(JSON.stringify(res.locals.session, null, 2))
    try {
        const user = req.session.user;
        if (user && user.id) {
            const User = await db.Users.findByPk(user.id);
            if (User) {
                res.locals.isAuthenticated = true;
                res.locals.isAdmin = User.role === 'admin';
                res.locals.firstName = User.username.split('.')[0].charAt(0).toUpperCase() + User.username.split('.')[0].slice(1);
                res.locals.permissions = User.permissions || {};
                res.locals.role = User.role;
            }
        }
    } catch (error) {
        logger.error(`Error validating user: ${error.message}`);
    }

    const username = req.session.user ? req.session.user.username : 'unknown user';
    const logMessage = `${username} accessed path ${req.method} ${req.path}`;
    if (req.path.includes('/update/')) {
        logger.warn(`-------- Warn: ${logMessage}`);
    } else if (req.path.includes('/delete/')) {
        logger.error(`------- Danger: ${logMessage}`);
    } else {
        logger.info(`${logMessage}`);
    }

    next();
});

app.use(async (req, res, next) => {
    try {
        if (res.locals.isAuthenticated) {
            res.locals.unpaidInvoices = {};
            res.locals.unsubmittedInvoices = {};
            res.locals.totalNotifications = 0;
            if (res.locals.permissions.unpaidInvoices) {
                const unpaidInvoices = await db.Invoices.findAll({
                    where: { remittanceDate: null },
                    attributes: ['id', 'kashflowNumber'],
                    order: [['kashflowNumber', 'ASC']]
                });
                res.locals.unpaidInvoices = unpaidInvoices;
                res.locals.totalNotifications =+ res.locals.unpaidInvoices;
            }
            if (res.locals.permissions.unsubmittedInvoices) {
                const unsubmittedInvoices = await db.Invoices.findAll({
                    where: { submissionDate: null },
                    attributes: ['id', 'kashflowNumber'],
                    order: [['kashflowNumber', 'ASC']]
                });
                res.locals.unsubmittedInvoices = unsubmittedInvoices;
                res.locals.totalNotifications =+ res.locals.unsubmittedInvoices;
            }
            const lastfetched = await kf.KF_Meta.findOne({
                order: [['lastFetchedAt', 'DESC']]
            })
            res.locals.lastfetched = lastfetched || null;
            res.locals.contactEmail = process.env.SUPPORTEMAIL;
            next();
        } else {
            res.locals.unpaidInvoices = {};
            res.locals.unsubmittedInvoices = {};
            res.locals.totalNotifications = 0;
            res.locals.lastfetched = null;
            next();
        }
    } catch (error) {
        logger.error('Error fetching invoices: ' + error);
        next();
    }
});

app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessages = req.flash('error');
    next();
});

const { slimDateTime } = require('./services/dateService');
const { formatCurrency, rounding } = require('./services/currencyService');

app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.package = packageJson.version;
    res.locals.copyrightyearstart = 2023;
    res.locals.copyrightyear = moment().year();
    res.locals.slimDateTime = slimDateTime;
    res.locals.formatCurrency = formatCurrency;
    res.locals.rounding = rounding;
    next();
});

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const holidayService = require('./services/holidayService');

app.use(async (req, res, next) => {
    try {
        // Check if today is a holiday
        const holidayDetails = await holidayService.isDateHoliday();

        if (holidayDetails?.isHoliday) {
            console.log(`Holiday detected: ${holidayDetails.reason} (${holidayDetails.startDate} to ${holidayDetails.endDate})`);
            
            // Render the holiday notice page if today is a holiday
            return res.render('holiday', {
                title: 'Holiday Notice',
                reason: holidayDetails.reason,
                startDate: holidayDetails.startDate,
                endDate: holidayDetails.endDate,
                errorMessages : req.flash('error'),
                successMessage : req.flash('success'),
            });
        }
        
        // If not a holiday, proceed to the next middleware
        next();
    } catch (error) {
        console.error('Error checking holiday status:', error.message);
        next(error); // Pass the error to the error-handling middleware
    }
});

const crypto = require('crypto');
if (process.env.NODE_ENV === 'development') {
    if (process.env.ENCRYPTION_KEY === '') {
        // Generate a 32-byte random key for AES-256
        const encryptionKey = crypto.randomBytes(32).toString('hex');
        //console.log('Your Encryption Key:', encryptionKey);
        //console.log('ENCRYPTION_KEY length:', encryptionKey.length);
        const encryptionKeyHEX = Buffer.from(encryptionKey, 'hex');
        //console.log('Your Encryption Key:', encryptionKeyHEX);
        //console.log('ENCRYPTION_KEY length:', encryptionKeyHEX.length);
    } else {
        //console.log('Encryption Key:', process.env.ENCRYPTION_KEY);
        //console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY.length);
        const encryptionKeyHEX = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        //console.log('Encryption Key:', encryptionKeyHEX);
        //console.log('ENCRYPTION_KEY length:', encryptionKeyHEX.length);
    }
}

const index = require('./controllers/renderIndex');

const formsUser = require('./controllers/forms/user');
const formsSubcontractor = require('./controllers/forms/subcontractor');
const formsInvoice = require('./controllers/forms/invoice');
const formsQuote = require('./controllers/forms/quote');
const formsClient = require('./controllers/forms/client');
const formsContact = require('./controllers/forms/contact');
const formsJob = require('./controllers/forms/job');
const formsLocation = require('./controllers/forms/location');
const formsAttendance = require('./controllers/forms/attendance');
const formsEmployee = require('./controllers/forms/employee');

const renderDashboard = require('./controllers/renderDashboards');

const userLogin = require('./controllers/user/login');
const userRegister = require('./controllers/user/register');
const userSettings = require('./controllers/user/settings');

const userCRUD = require('./controllers/CRUD/userCRUD');
const subcontractorCRUD = require('./controllers/CRUD/subcontractorCRUD');
const invoiceCRUD = require('./controllers/CRUD/invoiceCRUD');
const quoteCRUD = require('./controllers/CRUD/quoteCRUD');
const clientCRUD = require('./controllers/CRUD/clientCRUD');
const contactCRUD = require('./controllers/CRUD/contactCRUD');
const attendanceCRUD = require('./controllers/CRUD/attendanceCRUD');
const employeeCRUD = require('./controllers/CRUD/employeeCRUD');
const jobCRUD = require('./controllers/CRUD/jobCRUD');
const locationCRUD = require('./controllers/CRUD/locationCRUD');

const monthlyReturns = require('./controllers/monthlyReturns');
const yearlyReturns = require('./controllers/yearlyReturns');

const dailyAttendance = require('./controllers/dailyAttendance');
const weeklyAttendance = require('./controllers/weeklyAttendance');

//const kashflowRoutes = require('./kf/routes')

const verificationRoutes = require('./controllers/renderVerification');

const kashflowCustomer = require('./controllers/CRUD/kashflow/customer');
const kashflowInvoice = require('./controllers/CRUD/kashflow/invoice');
const kashflowProject = require('./controllers/CRUD/kashflow/project');
const kashflowQuote = require('./controllers/CRUD/kashflow/quote');
const kashflowReceipt = require('./controllers/CRUD/kashflow/receipt');
const kashflowSupplier = require('./controllers/CRUD/kashflow/supplier');

const fileSystemProjects = require('./controllers/fileSystemProjects');

/**
 * @swagger
 * /:
 *   get:
 *     summary: Render the index page
 *     responses:
 *       200:
 *         description: Index page rendered
 */
app.use('/', index);

/**
 * @swagger
 * /client:
 *   get:
 *     summary: Handle client forms
 *     responses:
 *       200:
 *         description: Client forms handled
 */
app.use('/client', formsClient);

/**
 * @swagger
 * /contact:
 *   get:
 *     summary: Handle contact forms
 *     responses:
 *       200:
 *         description: Contact forms handled
 */
app.use('/contact', formsContact);

/**
 * @swagger
 * /invoice:
 *   get:
 *     summary: Handle invoice forms
 *     responses:
 *       200:
 *         description: Invoice forms handled
 */
app.use('/invoice', formsInvoice);

/**
 * @swagger
 * /quote:
 *   get:
 *     summary: Handle quote forms
 *     responses:
 *       200:
 *         description: Quote forms handled
 */
app.use('/quote', formsQuote);

/**
 * @swagger
 * /subcontractor:
 *   get:
 *     summary: Handle subcontractor forms
 *     responses:
 *       200:
 *         description: Subcontractor forms handled
 */
app.use('/subcontractor', formsSubcontractor);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Handle user forms
 *     responses:
 *       200:
 *         description: User forms handled
 */
app.use('/user', formsUser);

/**
 * @swagger
 * /job:
 *   get:
 *     summary: Handle job forms
 *     responses:
 *       200:
 *         description: Job forms handled
 */
app.use('/job', formsJob);

/**
 * @swagger
 * /location:
 *   get:
 *     summary: Handle location forms
 *     responses:
 *       200:
 *         description: Location forms handled
 */
app.use('/location', formsLocation);

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Handle attendance forms
 *     responses:
 *       200:
 *         description: Attendance forms handled
 */
app.use('/attendance', formsAttendance);

/**
 * @swagger
 * /employee:
 *   get:
 *     summary: Handle employee forms
 *     responses:
 *       200:
 *         description: Employee forms handled
 */
app.use('/employee', formsEmployee);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Render the dashboard
 *     responses:
 *       200:
 *         description: Dashboard rendered
 */
app.use('/dashboard', renderDashboard);

/**
 * @swagger
 * /user/login:
 *   get:
 *     summary: Handle user login
 *     responses:
 *       200:
 *         description: User login handled
 */
app.use('/user', userLogin);

/**
 * @swagger
 * /user/register:
 *   get:
 *     summary: Handle user registration
 *     responses:
 *       200:
 *         description: User registration handled
 */
app.use('/user', userRegister);

/**
 * @swagger
 * /user/settings:
 *   get:
 *     summary: Handle user settings
 *     responses:
 *       200:
 *         description: User settings handled
 */
app.use('/user', userSettings);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Handle user CRUD operations
 *     responses:
 *       200:
 *         description: User CRUD operations handled
 */
app.use('/user', userCRUD);

/**
 * @swagger
 * /subcontractor:
 *   get:
 *     summary: Handle subcontractor CRUD operations
 *     responses:
 *       200:
 *         description: Subcontractor CRUD operations handled
 */
app.use('/subcontractor', subcontractorCRUD);

/**
 * @swagger
 * /invoice:
 *   get:
 *     summary: Handle invoice CRUD operations
 *     responses:
 *       200:
 *         description: Invoice CRUD operations handled
 */
app.use('/invoice', invoiceCRUD);

/**
 * @swagger
 * /quote:
 *   get:
 *     summary: Handle quote CRUD operations
 *     responses:
 *       200:
 *         description: Quote CRUD operations handled
 */
app.use('/quote', quoteCRUD);

/**
 * @swagger
 * /client:
 *   get:
 *     summary: Handle client CRUD operations
 *     responses:
 *       200:
 *         description: Client CRUD operations handled
 */
app.use('/client', clientCRUD);

/**
 * @swagger
 * /contact:
 *   get:
 *     summary: Handle contact CRUD operations
 *     responses:
 *       200:
 *         description: Contact CRUD operations handled
 */
app.use('/contact', contactCRUD);

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Handle attendance CRUD operations
 *     responses:
 *       200:
 *         description: Attendance CRUD operations handled
 */
app.use('/attendance', attendanceCRUD);

/**
 * @swagger
 * /employee:
 *   get:
 *     summary: Handle employee CRUD operations
 *     responses:
 *       200:
 *         description: Employee CRUD operations handled
 */
app.use('/employee', employeeCRUD);

/**
 * @swagger
 * /job:
 *   get:
 *     summary: Handle job CRUD operations
 *     responses:
 *       200:
 *         description: Job CRUD operations handled
 */
app.use('/job', jobCRUD);

/**
 * @swagger
 * /location:
 *   get:
 *     summary: Handle location CRUD operations
 *     responses:
 *       200:
 *         description: Location CRUD operations handled
 */
app.use('/location', locationCRUD);

/**
 * @swagger
 * /monthly:
 *   get:
 *     summary: Handle monthly returns
 *     responses:
 *       200:
 *         description: Monthly returns handled
 */
app.use('/monthly', monthlyReturns);

/**
 * @swagger
 * /yearly:
 *   get:
 *     summary: Handle yearly returns
 *     responses:
 *       200:
 *         description: Yearly returns handled
 */
app.use('/yearly', yearlyReturns);

/**
 * @swagger
 * /attendance/daily:
 *   get:
 *     summary: Handle daily attendance
 *     responses:
 *       200:
 *         description: Daily attendance handled
 */
app.use('/attendance', dailyAttendance);

/**
 * @swagger
 * /attendance/weekly:
 *   get:
 *     summary: Handle weekly attendance
 *     responses:
 *       200:
 *         description: Weekly attendance handled
 */
app.use('/attendance', weeklyAttendance);

/**
 * @swagger
 * /verify:
 *   get:
 *     summary: Handle verification
 *     responses:
 *       200:
 *         description: Verification handled
 */
app.use('/verify', verificationRoutes);

/**
 * @swagger
 * /kashflow/customer:
 *   get:
 *     summary: Handle Kashflow customer operations
 *     responses:
 *       200:
 *         description: Kashflow customer operations handled
 */
app.use('/kashflow', kashflowCustomer);

/**
 * @swagger
 * /kashflow/invoice:
 *   get:
 *     summary: Handle Kashflow invoice operations
 *     responses:
 *       200:
 *         description: Kashflow invoice operations handled
 */
app.use('/kashflow', kashflowInvoice);

/**
 * @swagger
 * /kashflow/project:
 *   get:
 *     summary: Handle Kashflow project operations
 *     responses:
 *       200:
 *         description: Kashflow project operations handled
 */
app.use('/kashflow', kashflowProject);

/**
 * @swagger
 * /kashflow/quote:
 *   get:
 *     summary: Handle Kashflow quote operations
 *     responses:
 *       200:
 *         description: Kashflow quote operations handled
 */
app.use('/kashflow', kashflowQuote);

/**
 * @swagger
 * /kashflow/receipt:
 *   get:
 *     summary: Handle Kashflow receipt operations
 *     responses:
 *       200:
 *         description: Kashflow receipt operations handled
 */
app.use('/kashflow', kashflowReceipt);

/**
 * @swagger
 * /kashflow/supplier:
 *   get:
 *     summary: Handle Kashflow supplier operations
 *     responses:
 *       200:
 *         description: Kashflow supplier operations handled
 */
app.use('/kashflow', kashflowSupplier);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Handle file system projects
 *     responses:
 *       200:
 *         description: File system projects handled
 */
app.use('/', fileSystemProjects);

// Catch undefined routes (404 handler)
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// Register the error handler
app.use(require('./services/errorHandlerService'));

if (process.env.NODE_ENV === 'development') {
    app.listen(80, '127.0.0.1', () => {
        logger.info(`Server is running development`);
    });
} else {
    app.listen(443, '0.0.0.0', () => {
        logger.info(`Server is running production`);
    });
}

module.exports = app;