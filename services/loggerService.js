// /services/loggerService.js
const { createLogger, format, transports } = require('winston');
const path = require('path');
const { combine, timestamp, printf, colorize, json } = format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

// Define logger
const logger = createLogger({
  level: 'debug',

  // Default format (used if no format is set on individual transport)
  format: combine(
    timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    json() // fallback format (mainly for file transport)
  ),

  transports: [
    // Console: colorized, pretty output
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        consoleFormat
      )
    }),

    // JSON file output: ideal for server-side log parsing/UI
    new transports.File({
      filename: path.join(__dirname, '../logs/app.json.log'),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
      tailable: true,
      format: combine(
        timestamp(),
        json()
      )
    })
  ]
});

module.exports = logger;