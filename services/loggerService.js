// /services/loggerService.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const fileTransport = new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d'
});

const errorTransport = new DailyRotateFile({
    filename: path.join(logDir, 'errors-%DATE%.log'),
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '60d'
});

const util = require('util');

const sanitizeLog = (info) => {
    if (info && info.sequelize) delete info.sequelize;
    if (info && info.dialect) delete info.dialect;
    return info;
};

const transportsList = [
    fileTransport
];

if (process.env.NODE_ENV !== 'production') {
    transportsList.push(new transports.Console());
}

/**
 * Creates a Winston logger instance with specified configuration.
 * Logs messages to the console and a file.
 * 
 * @returns {Object} - Winston logger instance.
 */
const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        format((info) => sanitizeLog(info))(),
        format.json()
    ),    
    transports: [
        fileTransport,
        errorTransport,
        ...(process.env.NODE_ENV !== 'production' ? [new transports.Console()] : [])
    ]
});

module.exports = logger;