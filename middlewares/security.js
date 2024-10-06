const helmet = require('helmet');
const xss = require('xss-clean');

const securityMiddleware = [
    helmet(),
    xss()
];

module.exports = securityMiddleware;