const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../services/loggerService');
const path = require('path');
const moment = require('moment');
const db = require('../../services/sequelizeDatabaseService');

// Create Employee
const createEmployee = async (req, res) => {
    try {
        const { name, email, phoneNumber, position, type, status, contactName, contactNumber, hourlyRate, hireDate } = req.body;
        await db.Employees.create({ name, email: email || null, phoneNumber: phoneNumber || null, position:position || null, type, status, contactName: contactName || null, contactNumber: contactNumber || null, hourlyRate, hireDate: hireDate || moment().NOW });
        req.flash('success', 'Employee created successfully.');
        res.redirect('/dashboard/employee');
    } catch (error) {
        logger.error('Error creating employee: ' + error.message);
        req.flash('error', 'Failed to create employee.');
        res.redirect('/employee/create');
    }
};

const readEmployee = async (req, res) => {
    try {
        const employee = await db.Employees.findByPk(req.params.employee);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.render(path.join('employees', 'viewEmployee'), {
            title: 'Employee',
            employee,
            
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error viewing employee: ' + error.message);
        req.flash('error', 'Error viewing employee: ' + error.message);
        res.redirect('/error');
    }
};

// Update Employee
const updateEmployee = async (req, res) => {
    try {
        const { name, email, phoneNumber, position, type, status, contactName, contactNumber, hourlyRate, hireDate } = req.body;
        await db.Employees.update({ name, email: email || null, phoneNumber: phoneNumber || null, position:position || null, type, status, contactName: contactName || null, contactNumber: contactNumber || null, hourlyRate, hireDate }, { where: { id: req.params.employee } });
        req.flash('success', 'Employee updated successfully.');
        res.redirect('/dashboard/employee');
    } catch (error) {
        logger.error('Error updating employee: ' + error.message);
        req.flash('error', 'Failed to update employee.');
        res.redirect(`/employee/update/${req.params.employee}`);
    }
};

// Delete Employee
const deleteEmployee = async (req, res) => {
    try {
        await db.Employees.destroy({ where: { id: req.params.employee } });
        req.flash('success', 'Employee deleted successfully.');
        res.redirect('/dashboard/employee');
    } catch (error) {
        logger.error('Error deleting employee: ' + error.message);
        req.flash('error', 'Failed to delete employee.');
        res.redirect('/dashboard/employee');
    }
};

router.get('/fetch/employee/:id', async (req, res) => {
    try {
        const employee = await db.Employees.findByPk(req.params.id);
        res.json({ employee });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

router.post('/employee/create', helpers.ensureAuthenticated, createEmployee);
router.get('/employee/read/:employee', helpers.ensureAuthenticated, readEmployee)
router.post('/employee/update/:employee', helpers.ensureAuthenticated, updateEmployee);
router.post('/employee/delete/:employee', helpers.ensureAuthenticated, deleteEmployee);

module.exports = router;
