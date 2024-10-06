const logger = require('../logger');

/**
 * Middleware to ensure the user is authenticated.
 * Logs session data and checks if the user is signed in.
 * If not, redirects to the sign-in page.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const ensureAuthenticated = (req, res, next) => {
    logger.info(`Session Data: ${JSON.stringify(req.session)}`);
    if (!req.session.user) {
        req.flash('error', 'Please sign in.');
        logger.info(`Unknown user accessed path ${req.method} ${req.originalUrl}`);
        return res.redirect('/signin');
    }
    res.locals.errorMessages = req.flash('error');
    res.locals.successMessages = req.flash('success');
    next();
};

/**
 * Middleware to ensure the user has one of the specified roles.
 * Checks if the user is signed in and has the correct role.
 * If not, redirects to the home page.
 * 
 * @param {Array} roles - The roles that are allowed to access the route.
 * @returns {Function} - The middleware function.
 */
const ensureRole = (roles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.flash('error', 'Please sign in.');
            return res.redirect('/signin');
        }
        if (!roles.includes(req.session.user.role)) {
            req.flash('error', 'Access denied | You do not have the correct role.');
            return res.redirect('/');
        }
        next();
    };
};

/**
 * Middleware to ensure the user has the required permissions.
 * Checks if the user is signed in and has the necessary permissions.
 * If not, redirects to the home page.
 * 
 * @param {Array} requiredPermissions - The permissions required to access the route.
 * @returns {Function} - The middleware function.
 */
const ensurePermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.flash('error', 'Please sign in.');
            return res.redirect('/signin');
        }

        const userPermissions = req.session.user;
        const hasPermission = requiredPermissions.every(permission => userPermissions[permission]);

        if (!hasPermission) {
            req.flash('error', 'Access denied | You do not have the correct permissions.');
            return res.redirect('/');
        }
        next();
    };
};

module.exports = {
    ensureAuthenticated,
    ensureRole,
    ensurePermission,
};