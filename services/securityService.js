const helmet = require('helmet');
const xss = require('xss-clean');
const logger = require('./loggerService');

// XSS protection middleware with logging
const xssMiddleware = (req, res, next) => {
    try {
        xss()(req, res, next);
    } catch (error) {
        logger.warn(`XSS attack blocked: ${req.ip} - ${req.originalUrl}`);
        res.status(403).send("Forbidden: Potential XSS detected");
    }
};

const securityService = [
    helmet(),
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", "https://app.heroncs.co.uk"],
            styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"], // Removed 'unsafe-inline'
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
            imgSrc: [
                "'self'", "data:", "otpauth:",
                "https://i.creativecommons.org", "https://licensebuttons.net",
                "https://sms.heroncs.co.uk",
                "https://a.tile.openstreetmap.org", "https://b.tile.openstreetmap.org", "https://c.tile.openstreetmap.org",
                "https://unpkg.com"
            ],
            connectSrc: ["'self'", "https://app.heroncs.co.uk", "https://nominatim.openstreetmap.org", "https://api.openstreetmap.org"],
            frameAncestors: ["'self'"] // Prevent clickjacking
        }
    }),
    helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }), // Enforce HTTPS
    xssMiddleware
];

module.exports = securityService;
