// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
    return '${timestamp} ${level}: ${message}';
});

const logger = createLogger({
    level: 'debug',
    format: combine(
        colorize(),
        timestamp({ format: 'DD-MM-YYY HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.Console(), // Log to the console
        new transports.File({ filename: 'app.log' }) // Log to a file
    ],
});

module.exports = logger;
