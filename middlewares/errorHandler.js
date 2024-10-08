const logger = require('../services/loggerService');

const errorHandler = (err, req, res, next) => {
    // Log the error stack
    logger.error(err.stack);

    // Log additional request details
    logger.error(`Request URL: ${req.originalUrl}`);
    logger.error(`Request Method: ${req.method}`);
    logger.error(`Request Headers: ${JSON.stringify(req.headers)}`);

    // Determine the status code and message
    let statusCode = err.statusCode || 500;
    let title = err.name || 'Error';
    let message = err.message || 'Something broke!';
    let stack = process.env.NODE_ENV === 'production' ? null : err.stack;

    res.status(statusCode).render('error', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        error: {
            title,
            message,
            stack
        }
    });
};

module.exports = errorHandler;