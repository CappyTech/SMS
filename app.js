const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const flash = require('express-flash');
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

// Middleware
app.use(require('./middlewares/logRequestDetails'));
app.use(require('./middlewares/rateLimiter'));
app.use(require('./middlewares/security'));
app.use(require('./middlewares/session'));
// app.use(require('./middlewares/createDefaultAdmin'));

const Users = require('./models/user');
const Subcontractors = require('./models/subcontractor');
const Invoices = require('./models/invoice');
const Employees = require('./models/employee');
const Attendances = require('./models/attendance');
const Quotes = require('./models/quote');
const Clients = require('./models/client');
const Contacts = require('./models/contact');
const Jobs = require('./models/job');
const Locations = require('./models/location');

// Association for Users and Subcontractors
Users.hasMany(Subcontractors, {
    foreignKey: 'userId',
    allowNull: false,
});
Subcontractors.belongsTo(Users, {
    foreignKey: 'userId',
    allowNull: false,
});

// Association for Subcontractors and Invoices
Subcontractors.hasMany(Invoices, {
    foreignKey: 'subcontractorId',
    allowNull: false,
    as: 'invoices',
});
Invoices.belongsTo(Subcontractors, {
    foreignKey: 'subcontractorId',
    allowNull: false,
});

// Association for Employees and Attendances
Employees.hasMany(Attendances, {
    foreignKey: 'employeeId',
    allowNull: false,
});
Attendances.belongsTo(Employees, {
    foreignKey: 'employeeId',
    allowNull: false,
});

// Association for Subcontractors and Attendances
Subcontractors.hasMany(Attendances, {
    foreignKey: 'subcontractorId',
    allowNull: false,
});
Attendances.belongsTo(Subcontractors, {
    foreignKey: 'subcontractorId',
    allowNull: false,
});

// Association for Clients and Quotes
Clients.hasMany(Quotes, {
    foreignKey: 'clientId',
    allowNull: false,
});
Quotes.belongsTo(Clients, {
    foreignKey: 'clientId',
    allowNull: false,
});

// Association for Clients and Contacts
Clients.hasMany(Contacts, {
    foreignKey: 'clientId',
    allowNull: false,
});
Contacts.belongsTo(Clients, {
    foreignKey: 'clientId',
    allowNull: false,
});

// Association for Clients and Jobs
Clients.hasMany(Jobs, {
    foreignKey: 'clientId',
    allowNull: false,
});
Jobs.belongsTo(Clients, {
    foreignKey: 'clientId',
    allowNull: false,
});

// Association for Quotes and Jobs
Quotes.hasMany(Jobs, {
    foreignKey: 'quoteId',
    allowNull: false,
});
Jobs.belongsTo(Quotes, {
    foreignKey: 'quoteId',
    allowNull: false,
});

// Association for Jobs and Locations
Locations.hasMany(Jobs, {
    foreignKey: 'locationId',
    allowNull: false,
});
Jobs.belongsTo(Locations, {
    foreignKey: 'locationId',
    allowNull: false,
});

// Association for Quotes and Locations
Locations.hasMany(Quotes, {
    foreignKey: 'locationId',
    allowNull: false,
});
Quotes.belongsTo(Locations, {
    foreignKey: 'locationId',
    allowNull: false,
});

// Association for Attendances and Locations
Locations.hasMany(Attendances, {
    foreignKey: 'locationId',
    allowNull: false,
});
Attendances.belongsTo(Locations, {
    foreignKey: 'locationId',
    allowNull: false,
});

// Association for Employees and managerId
Employees.hasMany(Employees, {
    foreignKey: 'managerId',
    allowNull: true,
});

// Association for Users
Users.belongsTo(Subcontractors, { foreignKey: 'subcontractorId', as: 'Subcontractor' });
Subcontractors.hasOne(Users, { foreignKey: 'subcontractorId' });

Users.belongsTo(Clients, { foreignKey: 'clientId', as: 'Client' });
Clients.hasOne(Users, { foreignKey: 'clientId' });

Users.belongsTo(Employees, { foreignKey: 'employeeId', as: 'Employee' });
Employees.hasOne(Users, { foreignKey: 'employeeId' });

//app.use(require('./middlewares/syncDatabase'));
//app.use(require('./middlewares/oneDriveSync')());
//app.use(require('./middlewares/blockBot'));

app.use((req, res, next) => {
    res.locals.session = req.session;
    logger.info(`Session Data: ${JSON.stringify(req.session)}`);
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
        const unpaidInvoices = await Invoices.findAll({
            where: { remittanceDate: null },
            attributes: ['id', 'kashflowNumber'],
            order: [['kashflowNumber', 'ASC']]
        });

        const unsubmittedInvoices = await Invoices.findAll({
            where: { submissionDate: null },
            attributes: ['id', 'kashflowNumber'],
            order: [['kashflowNumber', 'ASC']]
        });

        res.locals.unpaidInvoices = unpaidInvoices;
        res.locals.unsubmittedInvoices = unsubmittedInvoices;
        res.locals.totalNotifications = unpaidInvoices.length + unsubmittedInvoices.length;

        next();
    } catch (error) {
        logger.error('Error fetching invoices: ' + error);
        next();
    }
});

app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.package = packageJson.version;
    res.locals.node = process.version;
    res.locals.serverPlatform = `${os.type()} ${os.release()} (${os.arch()})`;
    res.locals.copyrightyearstart = 2023;
    res.locals.copyrightyear = moment().year();
    next();
});

app.use(require('./middlewares/errorHandler'));

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
        console.log('Your Encryption Key:', encryptionKey);
        console.log('ENCRYPTION_KEY length:', encryptionKey.length);
        const encryptionKeyHEX = Buffer.from(encryptionKey, 'hex');
        console.log('Your Encryption Key:', encryptionKeyHEX);
        console.log('ENCRYPTION_KEY length:', encryptionKeyHEX.length);
    } else {
        console.log('Encryption Key:', process.env.ENCRYPTION_KEY);
        console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY.length);
        const encryptionKeyHEX = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        console.log('Encryption Key:', encryptionKeyHEX);
        console.log('ENCRYPTION_KEY length:', encryptionKeyHEX.length);
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

if (process.env.NODE_ENV === 'development') {
    app.listen(80, '127.0.0.1', () => {
        logger.info(`Server is running development`);
    });
} else {
    app.listen(443, '0.0.0.0', () => {
        logger.info(`Server is running production`);
    });
}