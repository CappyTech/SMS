const logger = require('./loggerService');

const logRequestDetailsService = (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const clientHints = req.headers['sec-ch-ua'] || '';
    const platform = req.headers['sec-ch-ua-platform'] || 'Unknown';
    const isMobile = req.headers['sec-ch-ua-mobile'] === '?1';

    // Detect Browser
    let browser = 'Unknown';
    if (clientHints.includes('Brave')) browser = 'Brave';
    else if (clientHints.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';

    // Get real IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

    // Detect Suspicious User-Agent
    const suspiciousAgents = ['curl', 'wget', 'python', 'java', 'node'];
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
        logger.warn(`Possible bot detected from IP: ${clientIP}, User-Agent: ${userAgent}`);
    }

    // Store only loginTime in session
    req.session.user = {
        ...req.session.user,
        loginTime: req.session.user?.loginTime || new Date().toISOString(),
    };

    // Sanitize headers before logging
    const sanitizeLogData = (data) => {
        const sanitized = { ...data };
        if (sanitized.headers) {
            delete sanitized.headers['authorization'];
            delete sanitized.headers['cookie'];
            delete sanitized.headers['set-cookie'];
        }
        return sanitized;
    };

    // Structured Logging (Only in Development)
    if (process.env.NODE_ENV !== 'production') {
        logger.info({
            event: "incoming_request",
            method: req.method,
            url: req.originalUrl,
            ip: clientIP,
            userAgent: browser,
            platform: platform,
            mobile: isMobile ? 'Yes' : 'No',
            referer: req.headers['referer'] || 'N/A',
            host: req.headers['host'] || 'N/A',
            timestamp: new Date().toISOString(),
        });
    }

    next();
};

module.exports = logRequestDetailsService;
