// maintenanceMiddleware.js
module.exports = (req, res, next) => {
    if (isMaintenanceMode) {
        res.render('maintenance');
    } else {
        next();
    }
};