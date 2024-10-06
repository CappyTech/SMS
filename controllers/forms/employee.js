const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const moment = require('moment');
const logger = require('../../services/loggerService'); 
const path = require('path');
const Employees = require('../../models/employee');

const renderCreateEmployeeForm = (req, res) => {
    try {
        res.render(path.join('employees', 'createEmployee'), {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error creating employee: ' + error.message);
        req.flash('error', 'Failed to create employee.');
        res.redirect('/employee/create');
    }
};

const renderUpdateEmployeeForm = async (req, res) => {
    try {
        const employee = await Employees.findByPk(req.params.employee);
        if (!employee) {
            req.flash('error', 'Employee not found.');
            return res.redirect('/employee');
        }
        res.render(path.join('employees', 'updateEmployee'), {
            employee,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error fetching employee: ' + error.message);
        req.flash('error', 'Failed to fetch employee.');
        res.redirect('/employee');
    }
};

router.get('/employee/create', helpers.ensureAuthenticated, renderCreateEmployeeForm);
router.get('/employee/update/:employee', helpers.ensureAuthenticated, renderUpdateEmployeeForm);

module.exports = router;