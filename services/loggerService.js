const { createLogger, format, transports } = require('winston');
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
    format: combine(
        timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        json()
    ),
    transports: [
        applicationTransport,
        infoTransport,
        warnTransport,
        errorTransport
    ]
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
