require('dotenv').config();
const rateLimit = require('express-rate-limit');
const logger = require('./loggerService');

// Convert process.env.IP from a string to an array
const trustedIPs = process.env.IP ? process.env.IP.split(',') : [];

// Log when an IP exceeds rate limit
const rateLimitHandler = (req, res) => {
    logger.warn(`Rate limit exceeded: ${req.ip} - ${req.originalUrl}`);
    res.status(429).json({ message: 'Too many requests, please try again later.' });
};

// General API rate limit (300 requests per 15 minutes)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => trustedIPs.includes(req.ip),
    handler: rateLimitHandler
});

// Login rate limit (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many failed login attempts. Try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => trustedIPs.includes(req.ip),
    handler: rateLimitHandler
});

// Admin rate limit (100 requests per 30 minutes)
const adminLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 100,
    message: 'Too many admin requests. Try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => trustedIPs.includes(req.ip),
    handler: rateLimitHandler
});

module.exports = { apiLimiter, loginLimiter, adminLimiter };
