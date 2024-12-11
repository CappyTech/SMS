// /services/loggerService.js
const { createLogger, format, transports } = require('winston');
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
    format: combine(
        colorize(),
        timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.Console(), // Log to the console
        new transports.File({ filename: 'app.log' }) // Log to a file
    ],
});

module.exports = logger;