// app.js

// npm install express body-parser express-session express-mysql-session express-flash dotenv helmet xss-clean express-rate-limit express-ejs-layouts

const express = require('express');
const app = express();
const fs = require('fs');
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
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
    max: 100,
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
    console.log('MySQLStore ready');
}).catch(error => {
    console.error(error);
});

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

const flash = require('express-flash');

app.use(flash());

const helmet = require('helmet');

app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://fonts.googleapis.com",
            ],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
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
            connectSrc: ["'self'"],
        },
    })
);

const {
    Op
} = require("sequelize");

const createDefaultAdmin = async () => {
    try {
        const admin = await User.findOne({
            where: {
                [Op.or]: [{
                        username: 'admin'
                    },
                    {
                        role: 'admin'
                    }
                ]
            }
        });
        if (!admin) {
            await User.create({
                username: 'admin',
                email: 'admin@example.com',
                password: process.env.ADMIN_PASSWORD,
                role: 'admin',
            }, {
                fields: ['username', 'email', 'password', 'role']
            });
            console.log('Default admin created.');
        }
        if (admin) {
            console.log('Default admin already exists.');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const User = require('./models/user');
const Subcontractor = require('./models/subcontractor');
const Invoice = require('./models/invoice');
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
(async () => {
    try {
        await User.sync();
        await Subcontractor.sync();
        await Invoice.sync();
        await createDefaultAdmin();
        console.log('Models synced with the database');
    } catch (error) {
        console.error('Error syncing models:', error);
    }
})();

const renderFunctions = require('./controllers/renderFunctions');

const login = require('./controllers/login');
const register = require('./controllers/register');
const settings = require('./controllers/settings');

const userCRUD = require('./controllers/userCRUD');
const subcontractorCRUD = require('./controllers/subcontractorCRUD');
const invoiceCRUD = require('./controllers/invoiceCRUD');

const monthlyReturns = require('./controllers/monthlyReturns');
const yearlyReturns = require('./controllers/yearlyReturns');

app.use('/', renderFunctions);

app.use('/', login);
app.use('/', register);
app.use('/', settings);

app.use('/', userCRUD);
app.use('/', subcontractorCRUD);
app.use('/', invoiceCRUD);

app.use('/', monthlyReturns);
app.use('/', yearlyReturns);

app.use((err, req, res, next) => {
    console.error(err.stack);
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

const port = process.env.PORT || 80;
app.listen(port, '0.0.0.0', () => {
    console.log('Server listening...');
});