const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('express-flash');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');
const fs = require('fs');
require('dotenv').config();
const helpers = require('./helpers');
const os = require('os');
const packageJson = require('./package.json');
const sequelize = require('./db');
// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // default layout
app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(xss());
app.set('trust proxy', 1);

const useragent = require('useragent');

const logRequestDetails = (req, res, next) => {
    // Safely parse the user-agent
    const agent = req.headers['user-agent'] ? useragent.parse(req.headers['user-agent']) : null;

    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: agent ? {
            browser: agent.toAgent(),
            os: agent.os.toString(),
        } : 'Unknown',
        headers: req.headers,
        referer: req.headers['referer'] || 'N/A',
        host: req.headers['host'] || 'N/A',
        xForwardedFor: req.headers['x-forwarded-for'] || 'N/A',
        timestamp: new Date().toISOString(),
    };

    logger.info('Incoming Request Details: ' + JSON.stringify(logData, null, 2));

    next();
};

app.use(logRequestDetails);


app.use(flash());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1500,
    keyGenerator: (req) => {
        // Use the IP address for rate-limiting
        return req.ip;
    },
});
app.use(limiter);

app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", "https://sms.heroncs.co.uk"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            fontSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
            imgSrc: [
                "'self'",
                "data:",
                "otpauth:",
                "https://i.creativecommons.org",
                "https://licensebuttons.net",
                "https://sms.heroncs.co.uk",
                "https://a.tile.openstreetmap.org",
                "https://b.tile.openstreetmap.org",
                "https://c.tile.openstreetmap.org",
                "https://unpkg.com"
            ],
            connectSrc: [
                "'self'",
                "https://sms.heroncs.co.uk",
                "https://nominatim.openstreetmap.org",
                "https://api.openstreetmap.org"
            ]
        },
    })
);

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
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 600000,
        sameSite: 'strict',
    }
}));

sessionStore.onReady().then(() => {
    logger.info('MySQLStore ready');
}).catch(error => {
    logger.error(error);
});

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

const { Op } = require("sequelize");

const createDefaultAdmin = async () => {
    try {
        const admin = await Users.findOne({
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
        logger.error('Error creating default admin: ' + error);
    }
};

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


(async () => {
    try {
        // Sync all models at once
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true }); // Use alter to auto-migrate in development
            logger.info('All models synchronized in development mode.');
        } else if (process.env.NODE_ENV === 'production') {
            await sequelize.sync(); // In production, avoid altering the table structure automatically
            logger.info('All models synchronized in production mode.');
        }
        if (process.env.DEV) {
            await createDefaultAdmin(); // Create default admin user if needed
        }
    } catch (error) {
        logger.error('Error syncing models: ' + error);
    }
})();

app.use(async (req, res, next) => {
    try {
        res.locals.invoicesWithoutSubmissionDate = await Invoices.findAll({
            where: {
                submissionDate: null
            },
            attributes: ['id', 'kashflowNumber'],
            order: [['kashflowNumber', 'ASC']]
        });
        next();
    } catch (error) {
        logger.error('Error fetching invoices without submission date: ' + error);
        next();
    }
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
    next();
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    const status = err.status || 500;
    const errorViewPath = path.join(__dirname, 'views', `${status}.ejs`);

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
};

app.use(errorHandler);

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

const render = require('./controllers/renderForms');

const formsUser = require('./controllers/forms/user');
const formsSubcontractor = require('./controllers/forms/subcontractor');
const formsInvoice = require('./controllers/forms/invoice');
const formsError = require('./controllers/forms/error');
const formsQuote = require('./controllers/forms/quote');
const formsClient = require('./controllers/forms/client');
const formsContact = require('./controllers/forms/contact');
const formsJob = require('./controllers/forms/job');
const formsLocation = require('./controllers/forms/location');

const renderDashboard = require('./controllers/renderDashboards');

const userLogin = require('./controllers/user/login');
//const userRegister = require('./controllers/user/register');
const userSettings = require('./controllers/user/settings');

const userCRUD = require('./controllers/CRUD/userCRUD');
const subcontractorCRUD = require('./controllers/CRUD/subcontractorCRUD');
const invoiceCRUD = require('./controllers/CRUD/invoiceCRUD');
const quoteCRUD = require('./controllers/CRUD/quoteCRUD');
const clientCRUD = require('./controllers/CRUD/clientCRUD');
const contactCRUD = require('./controllers/CRUD/contactCRUD');
// const attendanceCRUD = require('./controllers/CRUD/attendanceCRUD');
// const employeeCRUD = require('./controllers/CRUD/employeeCRUD');
const jobCRUD = require('./controllers/CRUD/jobCRUD');
const locationCRUD = require('./controllers/CRUD/locationCRUD');

const monthlyReturns = require('./controllers/monthlyReturns');
const yearlyReturns = require('./controllers/yearlyReturns');

app.use('/', render);

app.use('/', formsClient);
app.use('/', formsContact);
app.use('/', formsError);
app.use('/', formsInvoice);
app.use('/', formsQuote);
app.use('/', formsSubcontractor);
app.use('/', formsUser);
app.use('/', formsJob);
app.use('/', formsLocation);

app.use('/', renderDashboard);

app.use('/', userLogin);
//app.use('/', userRegister);
app.use('/', userSettings);

app.use('/', userCRUD);
app.use('/', subcontractorCRUD);
app.use('/', invoiceCRUD);
app.use('/', quoteCRUD);
app.use('/', clientCRUD);
app.use('/', contactCRUD);
// app.use('/', attendanceCRUD);
// app.use('/', employeeCRUD);
app.use('/', jobCRUD);
app.use('/', locationCRUD);

app.use('/', monthlyReturns);
app.use('/', yearlyReturns);

app.listen(80, '127.0.0.1', () => {
    logger.info(`Server is running`);
});