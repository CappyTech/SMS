const rateLimit = require('express-rate-limit');

const rateLimiterService = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1500, // limit each IP to 1500 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

module.exports = rateLimiterService;