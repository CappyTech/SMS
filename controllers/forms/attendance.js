const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');

const renderAttendanceCreateForm = async (req, res) => {
    try {
        const { date, employeeId, subcontractorId } = req.query;
        const locations = await db.Locations.findAll();
        const employees = await db.Employees.findAll();
        const subcontractors = await db.Subcontractors.findAll();

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
        const attendance = await db.Attendances.findByPk(req.params.attendance);

        const locations = await db.Locations.findAll();
        const employees = await db.Employees.findAll();
        const subcontractors = await db.Subcontractors.findAll();

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

router.get('/attendance/create', authService.ensureAuthenticated, authService.ensureRole('admin'), renderAttendanceCreateForm);
router.get('/attendance/update/:attendance', authService.ensureAuthenticated, authService.ensureRole('admin'), renderAttendanceUpdateForm);

module.exports = router;