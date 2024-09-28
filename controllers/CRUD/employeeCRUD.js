const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');
const Employees = require('../../models/employee');

// Create Employee
const createEmployee = async (req, res) => {
    try {
        const { name, email, phoneNumber, position, type, status, contactName, contactNumber } = req.body;
        await Employees.create({ name, email, phoneNumber, position, type, status, contactName, contactNumber });
        req.flash('success', 'Employee created successfully.');
        res.redirect('/dashboard/employee');
    } catch (error) {
        logger.error('Error creating employee: ' + error.message);
        req.flash('error', 'Failed to create employee.');
        res.redirect('/employee/create');
    }
};

// Update Employee
const updateEmployee = async (req, res) => {
    try {
        const { name, email, phoneNumber, position, type, status, contactName, contactNumber } = req.body;
        await Employees.update({ name, email, phoneNumber, position, type, status, contactName, contactNumber }, { where: { id: req.params.employee } });
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
        await Employees.destroy({ where: { id: req.params.employee } });
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
        const employee = await Employees.findByPk(req.params.id);
        res.json({ employee });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

router.post('/employee/create', helpers.ensureAuthenticated, createEmployee);
router.post('/employee/update/:employee', helpers.ensureAuthenticated, updateEmployee);
router.post('/employee/delete/:employee', helpers.ensureAuthenticated, deleteEmployee);

module.exports = router;
