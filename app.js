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
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(flash());
app.use(useragent.express());

app.use(require('./services/securityService'));
app.use(require('./services/sessionService'));
app.use(require('./services/logRequestDetailsService'));
app.use(require('./services/rateLimiterService'));
app.use(require('./services/cronService'));
const db = require('./services/sequelizeDatabaseService');
const kf = require('./services/kashflowDatabaseService');

app.use(async (req, res, next) => {
    res.locals.session = req.session;
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;
    res.locals.firstName = null;
    res.locals.permissions = {};
    res.locals.role = null;

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
    res.locals.errorMessages = req.flash('error');
    res.locals.successMessage = req.flash('success');
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
                endDate: holidayDetails.endDate
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
const formsError = require('./controllers/forms/error');
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

const kashflowRoutes = require('./kf/routes')

const verificationRoutes = require('./controllers/renderVerification');

const kashflowCustomer = require('./controllers/CRUD/kashflow/customer');
const kashflowInvoice = require('./controllers/CRUD/kashflow/invoice');
const kashflowProject = require('./controllers/CRUD/kashflow/project');
const kashflowQuote = require('./controllers/CRUD/kashflow/quote');
const kashflowReceipt = require('./controllers/CRUD/kashflow/receipt');
const kashflowSupplier = require('./controllers/CRUD/kashflow/supplier');

app.use('/', index);

app.use('/', formsClient);
app.use('/', formsContact);
app.use('/', formsError);
app.use('/', formsInvoice);
app.use('/', formsQuote);
app.use('/', formsSubcontractor);
app.use('/', formsUser);
app.use('/', formsJob);
app.use('/', formsLocation);
app.use('/', formsAttendance);
app.use('/', formsEmployee);

app.use('/', renderDashboard);

app.use('/', userLogin);
app.use('/', userRegister);
app.use('/', userSettings);

app.use('/', userCRUD);
app.use('/', subcontractorCRUD);
app.use('/', invoiceCRUD);
app.use('/', quoteCRUD);
app.use('/', clientCRUD);
app.use('/', contactCRUD);
app.use('/', attendanceCRUD);
app.use('/', employeeCRUD);
app.use('/', jobCRUD);
app.use('/', locationCRUD);

app.use('/', monthlyReturns);
app.use('/', yearlyReturns);

app.use('/', dailyAttendance);
app.use('/', weeklyAttendance);

app.use('/', kashflowRoutes);

app.use('/', verificationRoutes);

app.use('/', kashflowCustomer);
app.use('/', kashflowInvoice);
app.use('/', kashflowProject);
app.use('/', kashflowQuote);
app.use('/', kashflowReceipt);
app.use('/', kashflowSupplier);

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