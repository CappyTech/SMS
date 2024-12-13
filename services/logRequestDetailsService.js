const logger = require('./loggerService');

const logRequestDetailsService = (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const clientHints = req.headers['sec-ch-ua'] || '';
    const platform = req.headers['sec-ch-ua-platform'] || 'Unknown';
    const isMobile = req.headers['sec-ch-ua-mobile'] === '?1';

    // Browser Detection
    let browser = 'Unknown';
    if (clientHints.includes('Brave')) {
        browser = 'Brave';
    } else if (clientHints.includes('Chrome')) {
        browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        browser = 'Opera';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
        browser = 'Internet Explorer';
    }

    // Save the details in the session
    req.session.user = {
        ...req.session.user, // Preserve existing user data
        userAgent: {
            browser: browser,
            version: userAgent.match(/(?:Chrome|Firefox|Version|MSIE|Opera|Safari|Edge|OPR)[/ ]([0-9.]+)/)?.[1] || 'Unknown',
            os: platform,
            mobile: isMobile ? 'Yes' : 'No',
        },
        ip: req.ip, // Save IP for tracking
        loginTime: req.session.user?.loginTime || new Date().toISOString(), // Save login time
    };

    // Log Details
    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: {
            browser: browser,
            platform: platform,
            mobile: isMobile ? 'Yes' : 'No',
            fullUserAgent: userAgent,
        },
        headers: req.headers,
        referer: req.headers['referer'] || 'N/A',
        host: req.headers['host'] || 'N/A',
        timestamp: new Date().toISOString(),
    };

    //logger.info('Incoming Request Details: ' + JSON.stringify(logData, null, 2));
    next();
};

module.exports = logRequestDetailsService;
