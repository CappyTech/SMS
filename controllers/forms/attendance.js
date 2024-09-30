const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');
const path = require('path');
const moment = require('moment');
const Attendances = require('../../models/attendance');
const Locations = require('../../models/location');
const Employees = require('../../models/employee');
const Subcontractors = require('../../models/subcontractor');

const renderAttendanceCreateForm = async (req, res) => {
    try {
        const { date, employeeId, subcontractorId } = req.query;
        const locations = await Locations.findAll();
        const employees = await Employees.findAll();
        const subcontractors = await Subcontractors.findAll();

        res.render(path.join('attendance', 'createAttendance'), {
            date: date ? moment(date).format('YYYY-MM-DD') : '', // Format the date for input[type="date"]
            employeeId: employeeId ?? null,
            subcontractorId: subcontractorId ?? null,
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
        const attendance = await Attendances.findByPk(req.params.attendance);

        const locations = await Locations.findAll();
        const employees = await Employees.findAll();
        const subcontractors = await Subcontractors.findAll();

        if (!attendance) {
            return res.status(404).send('Attendance not found');
        }

        res.render(path.join('attendance', 'updateAttendance'), {
            title: 'Update Attendance',
            attendance: attendance,
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

router.get('/attendance/create', helpers.ensureAuthenticated, renderAttendanceCreateForm);
router.get('/attendance/update/:attendance', helpers.ensureAuthenticated, renderAttendanceUpdateForm);

module.exports = router;