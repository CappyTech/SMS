const logger = require('./loggerService');

const errorHandlerService = (error, req, res, next) => {
    // Determine the status code, title, and message
    const statusCode = error.statusCode || 500;
    const title = `${statusCode} - ${error.name || 'Error'}`;
    const message = error.message || 'Something went wrong.';
    const stack = error.stack;

    // Get real client IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

    // Sanitize headers before logging
    const sanitizeHeaders = (headers) => {
        const sanitized = { ...headers };
        delete sanitized['authorization'];
        delete sanitized['cookie'];
        delete sanitized['set-cookie'];
        return sanitized;
    };

    // Structured Logging
    logger.error({
        event: "error",
        status: statusCode,
        title: title,
        message: message,
        stack: process.env.NODE_ENV === 'production' ? 'Hidden' : stack?.split('\n')[0] || 'No stack trace',
        url: req.originalUrl,
        method: req.method,
        ip: clientIP,
        headers: sanitizeHeaders(req.headers),
    });

    // Return JSON response for API errors
    if (req.originalUrl.startsWith('/api')) {
        return res.status(statusCode).json({
            error: {
                title,
                message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : message,
            }
        });
    }

    // Render error page for web requests
    try {
        res.status(statusCode).render('error', {
            title,
            error: {
                title,
                message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : message,
                stack: process.env.NODE_ENV === 'production' ? null : stack,
            },
        });
    } catch (renderError) {
        logger.error(`Error rendering error page: ${renderError.message}`);
        res.type('text/plain').send(`${title}: ${message}`);
    }
};

module.exports = errorHandlerService;
