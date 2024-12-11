const logger = require('../services/loggerService');

const errorHandler = (err, req, res, next) => {
    // Log the error details
    logger.error(err.stack);
    logger.error(`Request URL: ${req.originalUrl}`);
    logger.error(`Request Method: ${req.method}`);
    logger.error(`Request Headers: ${JSON.stringify(req.headers)}`);

    // Determine status code, title, and message
    const statusCode = err.statusCode;
    let title = `${err.statusCode} - ${err.name}`;
    const message = err.message || 'Something went wrong.';
    const stack = process.env.NODE_ENV === 'production' ? null : err.stack;

    // Render the error page
    res.status(statusCode).render('error', {
        title,
        error: {
            title,
            message,
            stack,
        },
    });
};

module.exports = errorHandler;
