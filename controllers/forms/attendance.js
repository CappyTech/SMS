const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');
const path = require('path');
const Attendances = require('../../models/attendance');
const Locations = require('../../models/location');
const Employees = require('../../models/employee');
const Subcontractors = require('../../models/subcontractor');

const renderAttendanceCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const locations = await Locations.findAll();
        const employees = await Employees.findAll();
        const subcontractors = await Subcontractors.findAll();

        res.render(path.join('attendance', 'createAttendance'), {
            title: 'Create Attendance',
            locations: locations,
            employees: employees,
            subcontractors: subcontractors,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering Attendance create form: ' + error.message);
        req.flash('error', 'Error rendering Attendance create form: ' + error.message);
         return res.redirect('/');
    }
};

const renderAttendanceUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const Attendances = await Attendances.findByPk(req.params.attendance);

        const locations = await Locations.findAll();
        const employees = await Employees.findAll();
        const subcontractors = await Subcontractors.findAll();

        if (!Attendances) {
            return res.status(404).send('Attendance not found');
        }

        res.render(path.join('attendance', 'updateAttendance'), {
            title: 'Update Attendance',
            Attendances,
            locations: locations,
            employees: employees,
            subcontractors: subcontractors,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering Attendance update form: ' + error.message);
        req.flash('error', 'Error rendering Attendance update form: ' + error.message);
         return res.redirect('/');
    }
};

router.get('/attendance/create', renderAttendanceCreateForm);
router.get('/attendance/update/:attendance', renderAttendanceUpdateForm);

module.exports = router;