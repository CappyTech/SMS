// app.js

// npm install express body-parser express-session express-mysql-session express-flash dotenv helmet xss-clean express-rate-limit express-ejs-layouts
const logger = require('./logger');
const express = require('express');
const app = express();
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();
const path = require('path');
const helpers = require('./helpers');
app.locals.slimDateTime = helpers.slimDateTime;
app.locals.formatCurrency = helpers.formatCurrency;
app.locals.packageJson = require('./package.json');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

app.set('view engine', 'ejs');
app.set('layout', 'layout');

const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);

const xss = require('xss-clean');
app.use(xss());

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1500,
});
app.use(limiter);

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    clearExpired: true,
    checkExpirationInterval: 300000,
    expiration: 43200000,
    createDatabaseTable: true,
    endConnectionOnClose: true,
    disableTouch: false,
    charset: 'utf8mb4_bin',
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
});
app.use(session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));
sessionStore.onReady().then(() => {
    if (process.env.DEBUG) {
        logger.info('MySQLStore ready');
    }
}).catch(error => {
    logger.error(error);
});

app.use((req, res, next) => {
    res.locals.session = req.session;
    if (process.env.DEBUG) {
        logger.info(`Session Data: ${JSON.stringify(req.session)}`);
    }
    const username = req.session.user ? req.session.user.username : 'unknown user';
    const logMessage = `${username} accessed path ${req.path}`;

    if (req.path.includes('/update/')) {
        logger.warn(`-------- Warn: ${logMessage}`);
    } else if (req.path.includes('/delete/')) {
        logger.error(`------- Danger: ${logMessage}`);
    } else {
        logger.info(`${logMessage}`);
    }
    next();
});

const flash = require('express-flash');

app.use(flash());
// Add the Origin-Agent-Cluster header to all responses
app.use((req, res, next) => {
    res.setHeader('Origin-Agent-Cluster', '?1');
    next();
});
const helmet = require('helmet');
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", "sms.heroncs.local"], // Added local domain explicitly
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://fonts.googleapis.com",
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
            ],
            fontSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://fonts.gstatic.com",
                "https://fonts.googleapis.com",
            ],
            imgSrc: [
                "'self'",
                "data:",
                "otpauth:",
                "https://i.creativecommons.org",
                "https://licensebuttons.net",
            ],
            connectSrc: ["'self'", "sms.heroncs.local"], // Allowing connections to local domain
        },
    })
);

const { Op } = require("sequelize");

const createDefaultAdmin = async () => {
    try {
        const admin = await User.findOne({
            where: {
                [Op.or]: [
                    { username: 'admin' },
                    { role: 'admin' }
                ]
            }
        });
        if (!admin) {
            await Users.create({
                username: process.env.ADMIN_USERNAME,
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                role: 'admin',
            }, {
                fields: ['username', 'email', 'password', 'role']
            });
            if (process.env.DEBUG) {
                logger.info('Default admin created.');
            }
        } else {
            if (process.env.DEBUG) {
                logger.info('Default admin already exists.');
            }
        }
    } catch (error) {
        logger.error('Error creating default admin:', error);
    }
};

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
        logger.error('Error fetching invoices:', error);
        next();
    }
});

const Users = require('./models/user');
const Subcontractors = require('./models/subcontractor');
const Invoices = require('./models/invoice');
const Employees = require('./models/employee')
const Attendances = require('./models/attendance');
const Quotes = require('./models/quote');
const Clients = require('./models/client');
const Contacts = require('./models/contact');

Users.hasMany(Subcontractors, {
    foreignKey: 'userId',
    allowNull: false,
});
Subcontractors.hasMany(Invoices, {
    foreignKey: 'SubcontractorId',
    allowNull: false,
    as: 'invoices'
});
Invoices.belongsTo(Subcontractors, {
    foreignKey: 'SubcontractorId',
    allowNull: false,
});
Employees.hasMany(Attendances, {
    foreignKey: 'employeeId',
    allowNull: true,
});
Subcontractors.hasMany(Attendances, {
    foreignKey: 'subcontractorId',
    allowNull: true,
});
Attendances.belongsTo(Employees, {
    foreignKey: 'employeeId',
    allowNull: true,
});
Attendances.belongsTo(Subcontractors, {
    foreignKey: 'subcontractorId',
    allowNull: true,
});
Clients.hasMany(Quotes, {
    foreignKey: 'clientId'
});
Quotes.belongsTo(Clients, {
    foreignKey: 'clientId'
});
Clients.hasMany(Contacts, {
    foreignKey: 'clientId',
    allowNull: false,
});
Contacts.belongsTo(Clients, {
    foreignKey: 'clientId',
    allowNull: false,
});

(async () => {
    try {
        await Users.sync();
        await Subcontractors.sync();
        await Invoices.sync();
        await Employees.sync();
        await Attendances.sync();
        await Clients.sync();
        await Quotes.sync();
        await Contacts.sync();
        if (process.env.DEBUG) {
            logger.info('Models synced with the database');
        };
        if (process.env.DEV) {
            await createDefaultAdmin();
        }
    } catch (error) {
        logger.error('Error syncing models:', error);
    }
})();

const renderForms = require('./controllers/renderForms');
const renderDashboard = require('./controllers/renderDashboards')

const login = require('./controllers/login');
const register = require('./controllers/register');
const settings = require('./controllers/settings');

const userCRUD = require('./controllers/userCRUD');
const subcontractorCRUD = require('./controllers/subcontractorCRUD');
const invoiceCRUD = require('./controllers/invoiceCRUD');
const quoteCRUD = require('./controllers/quoteCRUD');
const clientCRUD = require('./controllers/clientCRUD');
const contactCRUD = require('./controllers/contactCRUD');
// const attendanceCRUD = require('./controllers/attendanceCRUD');
// const employeeCRUD = require('./controllers/employeeCRUD');

const monthlyReturns = require('./controllers/monthlyReturns');
const yearlyReturns = require('./controllers/yearlyReturns');

app.use('/', renderForms);
app.use('/', renderDashboard);
app.use('/', login);
app.use('/', register);
app.use('/', settings);

app.use('/', userCRUD);
app.use('/', subcontractorCRUD);
app.use('/', invoiceCRUD);
app.use('/', quoteCRUD);
app.use('/', clientCRUD);
app.use('/', contactCRUD);
// app.use('/', attendanceCRUD);
// app.use('/', employeeCRUD);

app.use('/', monthlyReturns);
app.use('/', yearlyReturns);

app.use((err, req, res, next) => {
    logger.error(err.stack);
    const status = err.status || 500;
    const errorViewPath = path.join(__dirname, 'views', `${status}.ejs`);

    // Use a different variable name for the error in fs.access callback
    fs.access(errorViewPath, fs.constants.F_OK, (fsErr) => {
        if (fsErr) {
            res.status(status).render('error', {
                message: err.message,
                error: err
            });
        } else {
            res.status(status).render(String(status), {
                message: err.message,
                error: err
            });
        }
    });
});

const port = 80;
app.listen(port, 'localhost', () => {
    logger.info('Server running at http://localhost');
});
