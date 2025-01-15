const express = require('express');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const logger = require('../services/loggerService');
const attendanceService = require('../services/attendanceService');
const authService = require('../services/authService');
const db = require('../services/sequelizeDatabaseService');

const getDailyAttendance = async (req, res, next) => {
    const date = req.params.date || moment().format('YYYY-MM-DD'); // Default to today
    try {
        const attendance = attendanceService.getAttendanceForDay(date,[db.Locations, db.Employees, db.Subcontractors]);
        
        res.render(path.join('attendance', 'daily'), {
            moment,
            attendance,
            date,
            errorMessages : req.flash('error'),
            successMessage : req.flash('success'),
            currentTab: 'daily'
        });
    } catch (error) {
        logger.error('Error fetching daily attendance: ' + error.message);
        req.flash('error', 'Error fetching daily attendance: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

router.get('/attendance/daily/:date?', authService.ensureAuthenticated, authService.ensureRole('admin'), getDailyAttendance);

module.exports = router;