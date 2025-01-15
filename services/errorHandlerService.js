const logger = require('./loggerService');

const errorHandlerService = (error, req, res, next) => {
    // Determine the status code, title, and message
    const statusCode = error.statusCode || 500; // Default to 500 if not set
    const title = `${statusCode} - ${error.name || 'Error'}`;
    const message = error.message || 'Something went wrong.';
    const stack = error.stack ;

    // Log the error details
    logger.error(`Error Details:
        Status: ${statusCode}
        Title: ${title}
        Message: ${message}
        Stack: ${stack ? stack.split('\n')[0] : 'No stack trace'} 
        URL: ${req.originalUrl}
        Method: ${req.method}`);

    logger.error(`Request Headers: ${JSON.stringify(req.headers, null, 2)}`);

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

module.exports = errorHandlerService;
