const helmet = require('helmet');
const xss = require('xss-clean');

const securityMiddleware = [
    helmet(),
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", "https://app.heroncs.co.uk"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            fontSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
            imgSrc: [
                "'self'",
                "data:",
                "otpauth:",
                "https://i.creativecommons.org",
                "https://licensebuttons.net",
                "https://sms.heroncs.co.uk",
                "https://a.tile.openstreetmap.org",
                "https://b.tile.openstreetmap.org",
                "https://c.tile.openstreetmap.org",
                "https://unpkg.com"
            ],
            connectSrc: [
                "'self'",
                "https://app.heroncs.co.uk",
                "https://nominatim.openstreetmap.org",
                "https://api.openstreetmap.org"
            ]
        },
    }),
    xss()
];

module.exports = securityMiddleware;