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
            await User.create({
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

app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});

app.use(async (req, res, next) => {
    try {
        res.locals.invoicesWithoutSubmissionDate = await Invoice.findAll({
            where: {
                submissionDate: null
            },
            attributes: ['id', 'kashflowNumber'],
            order: [['kashflowNumber', 'ASC']]
        });
        next();
    } catch (error) {
        logger.error('Error fetching invoices:', error);
        next();
    }
});

app.use(async (req, res, next) => {
    try {
        const unpaidInvoices = await Invoice.findAll({
            where: { remittanceDate: null },
            attributes: ['id', 'kashflowNumber'],
            order: [['kashflowNumber', 'ASC']]
        });

        const unsubmittedInvoices = await Invoice.findAll({
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

const User = require('./models/user');
const Subcontractor = require('./models/subcontractor');
const Invoice = require('./models/invoice');
const Worker = require('./models/worker')
const Attendance = require('./models/attendance');

User.hasMany(Subcontractor, {
    foreignKey: 'userId',
    allowNull: false,
});
Subcontractor.hasMany(Invoice, {
    foreignKey: 'SubcontractorId',
    allowNull: false,
    as: 'invoices'
});
Invoice.belongsTo(Subcontractor, {
    foreignKey: 'SubcontractorId',
    allowNull: false,
});
Worker.hasMany(Attendance, {
    foreignKey: 'workerId',
    allowNull: true,
});
Subcontractor.hasMany(Attendance, {
    foreignKey: 'subcontractorId',
    allowNull: true,
});
Attendance.belongsTo(Worker, {
    foreignKey: 'workerId',
    allowNull: true,
});
Attendance.belongsTo(Subcontractor, {
    foreignKey: 'subcontractorId',
    allowNull: true,
});

(async () => {
    try {
        await User.sync();
        await Subcontractor.sync();
        await Invoice.sync();
        await Worker.sync();
        await Attendance.sync();
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

const renderFunctions = require('./controllers/renderFunctions');

const login = require('./controllers/login');
const register = require('./controllers/register');
const settings = require('./controllers/settings');

const userCRUD = require('./controllers/userCRUD');
const subcontractorCRUD = require('./controllers/subcontractorCRUD');
const invoiceCRUD = require('./controllers/invoiceCRUD');
const quoteCRUD = require('./controllers/quoteCRUD');

const monthlyReturns = require('./controllers/monthlyReturns');
const yearlyReturns = require('./controllers/yearlyReturns');

app.use('/', renderFunctions);

app.use('/', login);
app.use('/', register);
app.use('/', settings);

app.use('/', userCRUD);
app.use('/', subcontractorCRUD);
app.use('/', invoiceCRUD);
app.use('/', quoteCRUD);

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
