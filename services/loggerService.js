const { createLogger, format, transports } = require('winston');
<<<<<<< HEAD
const { combine, timestamp, json } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const fileOptions = {
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d'
};

const applicationTransport = new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    level: 'debug',
    ...fileOptions
});

const infoTransport = new DailyRotateFile({
    filename: path.join(logDir, 'info-%DATE%.log'),
    level: 'info',
    ...fileOptions
});

const warnTransport = new DailyRotateFile({
    filename: path.join(logDir, 'warn-%DATE%.log'),
    level: 'warn',
    ...fileOptions
});

const errorTransport = new DailyRotateFile({
    filename: path.join(logDir, 'errors-%DATE%.log'),
    level: 'error',
    maxFiles: '60d',
    ...fileOptions
});

const baseLogger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
=======
const { combine, timestamp, printf, colorize } = format;

/**
 * Custom log format for Winston logger.
 * Formats log messages with timestamp, log level, and message.
 * 
 * @param {Object} info - Log information object.
 * @param {string} info.level - Log level (e.g., 'info', 'error').
 * @param {string} info.message - Log message.
 * @param {string} info.timestamp - Timestamp of the log message.
 * @returns {string} - Formatted log message.
 */
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

/**
 * Creates a Winston logger instance with specified configuration.
 * Logs messages to the console and a file.
 * 
 * @returns {Object} - Winston logger instance.
 */
const logger = createLogger({
    level: 'debug',
>>>>>>> parent of acd4089 (Update loggerService.js)
    format: combine(
        colorize(),
        timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
<<<<<<< HEAD
        format.printf(({ level, message, timestamp, ...meta }) => {
            let metaString = '';
            if (Object.keys(meta).length) {
                try {
                    metaString = JSON.stringify(meta, null, 2);
                } catch (error) {
                    metaString = '[Error serializing metadata]';
                }
            }
            return `${timestamp} [${level.toUpperCase()}] ${message} ${metaString}`;
        })
    ),
    transports: [
        applicationTransport,
        infoTransport,
        warnTransport,
        errorTransport
    ]
=======
        logFormat
    ),
    transports: [
        new transports.Console(), // Log to the console
        new transports.File({ filename: 'app.log' }) // Log to a file
    ],
>>>>>>> parent of acd4089 (Update loggerService.js)
});

if (process.env.NODE_ENV !== 'production') {
    baseLogger.add(new transports.Console({
        format: combine(
            timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
            format.colorize(),
            format.simple()
        )
    }));
}

const logger = {
    debug: baseLogger.debug.bind(baseLogger),
    info: baseLogger.info.bind(baseLogger),
    warn: baseLogger.warn.bind(baseLogger),
    error: baseLogger.error.bind(baseLogger)
};

module.exports = logger;
