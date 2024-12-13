const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config({ path: '../.env' });
const logger = require('./loggerService');

const options = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    clearExpired: true,
    checkExpirationInterval: 300000,
    expiration: 28800000,
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
};

const sessionStore = new MySQLStore(options);

const sessionService = session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 28800000,
        sameSite: 'strict',
    }
});

sessionStore.onReady().then(() => {
    //logger.info('MySQLStore ready');
}).catch(error => {
    logger.error(error);
});

module.exports = sessionService;