const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = require('../redisClient');

const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
});

module.exports = sessionMiddleware;