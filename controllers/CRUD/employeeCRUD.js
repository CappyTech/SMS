const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const moment = require('moment');
const logger = require('../../logger'); 
const path = require('path');
const Employees = require('../../models/employee');

const createEmployee = async (req, res) => {
    try {
        const { name } = req.body;
        await Employees.create({ name });
        req.flash('success', 'Employee created successfully.');
        res.redirect('/dashboard/employee');
    } catch (error) {
        logger.error('Error creating employee: ' + error.message);
        req.flash('error', 'Failed to create employee.');
        res.redirect('/employee/create');
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { name, position } = req.body;
        await Employees.update({ name, position }, { where: { id: req.params.employee } });
        req.flash('success', 'Employee updated successfully.');
        res.redirect('/employee');
    } catch (error) {
        logger.error('Error updating employee: ' + error.message);
        req.flash('error', 'Failed to update employee.');
        res.redirect(`/employee/update/${req.params.id}`);
    }
};

// Delete Employee
const deleteEmployee = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        await Employees.destroy({ where: { id: req.params.employee } });
        
        req.flash('success', 'Employee deleted successfully.');
        res.redirect('/employee');
    } catch (error) {
        logger.error('Error deleting employee: ' + error.message);
        req.flash('error', 'Failed to delete employee.');
        res.redirect('/employee');
    }
};

router.get('/fetch/employee/:id', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const employee = await Employees.findAll({
            where: { id: req.params.id },
            order: [['createdAt', 'ASC']],
        });

        res.json({ employee });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

router.post('/employee/create', helpers.ensureAuthenticated, createEmployee);
router.post('/employee/update/:employee', helpers.ensureAuthenticated, updateEmployee);
router.post('/employee/delete/:employee', helpers.ensureAuthenticated, deleteEmployee);

module.exports = router;