const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const path = require('path');
const db = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');

const readCustomer = async (req, res, next) => {
    try {
        const Customer = await db.KF_Customers.findByPk(req.params.uuid);

        if (!Customer) {
            req.flash('error', 'Customer not found.');
            return res.redirect('/dashboard/KFcustomer');
        }

        res.render(path.join('kashflow', 'viewCustomer'), {
            title: 'Customer Overview',
            Customer,
        });
    } catch (error) {
        logger.error('Error reading kashflow customer:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

router.get('/kf/customer/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readCustomer);

module.exports = router;