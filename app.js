const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const flash = require('express-flash');
const useragent = require('express-useragent');
const logger = require('./services/loggerService');
require('dotenv').config();
const packageJson = require('./package.json');
const os = require('os');
const moment = require('moment');
//const sequelize = require('./services/databaseService');
const app = express();
app.set('trust proxy', true);
// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // default layout
app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(flash());
app.use(useragent.express());

// Middleware
app.use(require('./middlewares/security'));
app.use(require('./middlewares/session'));
app.use(require('./middlewares/logRequestDetails'));
app.use(require('./middlewares/rateLimiter'));
// app.use(require('./middlewares/createDefaultAdmin'));

const db = require('./services/sequelizeDatabaseService');

// Association for Users and Subcontractors
db.Users.hasMany(db.Subcontractors, {
    foreignKey: 'userId',
    allowNull: false,
});
db.Subcontractors.belongsTo(db.Users, {
    foreignKey: 'userId',
    allowNull: false,
});

// Association for Subcontractors and Invoices
db.Subcontractors.hasMany(db.Invoices, {
    foreignKey: 'subcontractorId',
    allowNull: false,
    as: 'invoices',
});
db.Invoices.belongsTo(db.Subcontractors, {
    foreignKey: 'subcontractorId',
    allowNull: false,
});

// Association for Employees and Attendances
db.Employees.hasMany(db.Attendances, {
    foreignKey: 'employeeId',
    allowNull: false,
});
db.Attendances.belongsTo(db.Employees, {
    foreignKey: 'employeeId',
    allowNull: false,
});

// Association for Subcontractors and Attendances
db.Subcontractors.hasMany(db.Attendances, {
    foreignKey: 'subcontractorId',
    allowNull: false,
});
db.Attendances.belongsTo(db.Subcontractors, {
    foreignKey: 'subcontractorId',
    allowNull: false,
});

// Association for Clients and Quotes
db.Clients.hasMany(db.Quotes, {
    foreignKey: 'clientId',
    allowNull: false,
});
db.Quotes.belongsTo(db.Clients, {
    foreignKey: 'clientId',
    allowNull: false,
});

// Association for Clients and Contacts
db.Clients.hasMany(db.Contacts, {
    foreignKey: 'clientId',
    allowNull: false,
});
db.Contacts.belongsTo(db.Clients, {
    foreignKey: 'clientId',
    allowNull: false,
});

// Association for Clients and Jobs
db.Clients.hasMany(db.Jobs, {
    foreignKey: 'clientId',
    allowNull: false,
});
db.Jobs.belongsTo(db.Clients, {
    foreignKey: 'clientId',
    allowNull: false,
});

// Association for Quotes and Jobs
db.Quotes.hasMany(db.Jobs, {
    foreignKey: 'quoteId',
    allowNull: false,
});
db.Jobs.belongsTo(db.Quotes, {
    foreignKey: 'quoteId',
    allowNull: false,
});

// Association for Jobs and Locations
db.Locations.hasMany(db.Jobs, {
    foreignKey: 'locationId',
    allowNull: false,
});
db.Jobs.belongsTo(db.Locations, {
    foreignKey: 'locationId',
    allowNull: false,
});

// Association for Quotes and Locations
db.Locations.hasMany(db.Quotes, {
    foreignKey: 'locationId',
    allowNull: false,
});
db.Quotes.belongsTo(db.Locations, {
    foreignKey: 'locationId',
    allowNull: false,
});

// Association for Attendances and Locations
db.Locations.hasMany(db.Attendances, {
    foreignKey: 'locationId',
    allowNull: false,
});
db.Attendances.belongsTo(db.Locations, {
    foreignKey: 'locationId',
    allowNull: false,
});

// Association for Employees and managerId
db.Employees.hasMany(db.Employees, {
    foreignKey: 'managerId',
    allowNull: true,
});

// Association for Users
db.Users.belongsTo(db.Subcontractors, { foreignKey: 'subcontractorId', as: 'Subcontractor' });
db.Subcontractors.hasOne(db.Users, { foreignKey: 'subcontractorId' });

db.Users.belongsTo(db.Clients, { foreignKey: 'clientId', as: 'Client' });
db.Clients.hasOne(db.Users, { foreignKey: 'clientId' });

db.Users.belongsTo(db.Employees, { foreignKey: 'employeeId', as: 'Employee' });
db.Employees.hasOne(db.Users, { foreignKey: 'employeeId' });

//app.use(require('./middlewares/syncDatabase'));
//app.use(require('./middlewares/oneDriveSync')());
//app.use(require('./middlewares/blockBot'));

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
            const dbUser = await db.Users.findByPk(user.id);
            if (dbUser) {
                res.locals.isAuthenticated = true;
                res.locals.isAdmin = dbUser.role === 'admin';
                res.locals.firstName = dbUser.username.split('.')[0].charAt(0).toUpperCase() + dbUser.username.split('.')[0].slice(1);
                res.locals.permissions = dbUser.permissions || {};
                res.locals.role = dbUser.role;
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
        if (req.session && req.session.user) {
            const unpaidInvoices = await db.Invoices.findAll({
                where: { remittanceDate: null },
                attributes: ['id', 'kashflowNumber'],
                order: [['kashflowNumber', 'ASC']]
            });
            const unsubmittedInvoices = await db.Invoices.findAll({
                where: { submissionDate: null },
                attributes: ['id', 'kashflowNumber'],
                order: [['kashflowNumber', 'ASC']]
            });
            res.locals.unpaidInvoices = unpaidInvoices;
            res.locals.unsubmittedInvoices = unsubmittedInvoices;
            res.locals.totalNotifications = unpaidInvoices.length + unsubmittedInvoices.length;

            const lastfetched = await db.KF_Meta.findOne({
                order: [['lastFetchedAt', 'DESC']]
            })
            res.locals.lastfetched = lastfetched || null;
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
const cronService = require('./services/cronService');

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

const verificationRoutes  = require('./controllers/renderVerification');
const { where } = require('sequelize');
const { ensureAuthenticated } = require('./services/authService');

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

// Catch undefined routes (404 handler)
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// Register the error handler
app.use(require('./middlewares/errorHandler'));

if (process.env.NODE_ENV === 'development') {
    app.listen(80, '127.0.0.1', () => {
        logger.info(`Server is running development`);
    });
} else {
    app.listen(443, '0.0.0.0', () => {
        logger.info(`Server is running production`);
    });
}