const logger = require('../services/loggerService');

const errorHandler = (err, req, res, next) => {
    // Determine the status code, title, and message
    const statusCode = err.statusCode || 500; // Default to 500 if not set
    const title = `${statusCode} - ${err.name || 'Error'}`;
    const message = err.message || 'Something went wrong.';
    const stack = process.env.NODE_ENV === 'production' ? null : err.stack || 'No stack trace available';

    // Log the error details
    logger.error(`Error Details:
        Status: ${statusCode}
        Title: ${title}
        Message: ${message}
        Stack: ${stack ? stack.split('\n')[0] : 'No stack trace'} 
        URL: ${req.originalUrl}
        Method: ${req.method}`);

    logger.error(`Request Headers: ${JSON.stringify(req.headers)}`);

    // Render the error page
    res.status(statusCode);
    try {
        res.render('error', {
            title,
            error: {
                title,
                message,
                stack,
            },
        });
    } catch (renderError) {
        // Fallback if res.render fails
        logger.error('Error rendering error page:', renderError.message);
        res.type('text/plain').send(`${title}: ${message}`);
    }
};

module.exports = errorHandler;
