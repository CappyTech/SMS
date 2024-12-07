const useragent = require('express-useragent');
const logger = require('../services/loggerService');

const logRequestDetails = (req, res, next) => {
    const agent = req.useragent || {};

    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: {
            browser: agent.browser || 'Unknown',
            version: agent.version || 'Unknown',
            os: agent.os || 'Unknown',
            platform: agent.platform || 'Unknown',
        },
        headers: req.headers,
        referer: req.headers['referer'] || 'N/A',
        host: req.headers['host'] || 'N/A',
        xForwardedFor: req.headers['x-forwarded-for'] || 'N/A',
        timestamp: new Date().toISOString(),
    };

    logger.info('Incoming Request Details: ' + JSON.stringify(logData, null, 2));

    next();
};

module.exports = logRequestDetails;