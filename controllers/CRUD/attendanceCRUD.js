const express = require('express');
const router = express.Router();
const Attendances = require('../../models/attendance');
const Locations = require('../../models/location');
const Employees = require('../../models/employee');
const Subcontractors = require('../../models/subcontractor');
const moment = require('moment');
const { Op } = require('sequelize');
const helpers = require('../../helpers');
const path = require('path');
const logger = require('../../logger');

const createAttendance = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const {
            date,
            locationId,
            employeeId,
            subcontractorId,
        } = req.body;

        await Attendances.create({
            date,
            locationId,
            employeeId: employeeId || null,
            subcontractorId: subcontractorId || null, 
        });

        req.flash('success', 'Attendance record created successfully.');
        res.redirect('/dashboard/attendance');
    } catch (error) {
        logger.error('Error creating attendance: ' + error.message);
        req.flash('error', 'Failed to create attendance.');
        res.redirect('/dashboard/attendance');
    }
};

const updateAttendance = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const { id } = req.params;
        const { date, locationId } = req.body;

        await Attendances.update(
            { date, locationId },
            { where: { id } }
        );

        req.flash('success', 'Attendance record updated successfully.');
        res.redirect('dashboard/attendance');
    } catch (error) {
        logger.error('Error updating attendance: ' + error.message);
        req.flash('error', 'Failed to update attendance.');
        res.redirect('dashboard/attendance');
    }
};

const deleteAttendance = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const attendance = req.params.attendance;

        await Attendances.destroy({ where: { attendance } });

        req.flash('success', 'Attendance record deleted successfully.');
        res.redirect('dashboard/attendance');
    } catch (error) {
        logger.error('Error deleting attendance: ' + error.message);
        req.flash('error', 'Failed to delete attendance.');
        res.redirect('dashboard/attendance');
    }
};

const getDailyAttendance = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
         req.flash('error', 'Access denied.');
        return res.redirect('/');
    }
    const date = req.params.date || moment().format('YYYY-MM-DD'); // Default to today
    try {
        const attendance = await Attendances.findAll({
            where: { date },
            include: [Locations, Employees, Subcontractors]
        });
        res.render(path.join('attendance', 'daily'), {
            attendance,
            date,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error fetching daily attendance: ' + error.message);
        res.status(500).send('Internal Server Error');
    }
};

const getWeeklyAttendance = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        req.flash('error', 'Access denied.');
        return res.redirect('/');
    }

    const startDate = req.params.startDate
        ? moment(req.params.startDate, 'YYYY-MM-DD')
        : helpers.getStartOfWeek(moment()); // Default to start of current week (Monday)
    const endDate = moment(startDate).add(6, 'days');

    try {
        const attendance = await Attendances.findAll({
            where: {
                date: {
                    [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                }
            },
            include: [Locations, Employees, Subcontractors],
            order: [['date', 'ASC']] // Ensure attendance is ordered by date
        });

        // Group the attendance records by date and person (employee or subcontractor)
        const groupedAttendance = {};
        attendance.forEach(record => {
            const personName = record.Employee ? record.Employee.name : record.Subcontractor.company;
            const dateKey = moment(record.date).format('YYYY-MM-DD');
            if (!groupedAttendance[personName]) {
                groupedAttendance[personName] = {};
            }
            groupedAttendance[personName][dateKey] = {
                location: record.Location ? record.Location.address : 'N/A',
                holidays_taken: record.holidays_taken || 0,
                days_without_work: record.days_without_work || 0,
            };
        });

        const daysOfWeek = [];
        for (let i = 0; i < 7; i++) {
            daysOfWeek.push(moment(startDate).add(i, 'days').format('YYYY-MM-DD'));
        }

        res.render(path.join('attendance', 'weekly'), {
            moment,
            groupedAttendance,
            daysOfWeek,
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error fetching weekly attendance: ' + error.message);
        res.status(500).send('Internal Server Error');
    }
};


const getMonthlyAttendance = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
    const year = req.params.year || moment().year(); // Default to current year
    const month = req.params.month || moment().month() + 1; // Default to current month (note: moment months are 0-indexed)
    const startDate = moment(`${year}-${month}-01`);
    const endDate = moment(startDate).endOf('month');
    try {
        const attendance = await Attendances.findAll({
            where: {
                date: {
                    [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                }
            },
            include: [Locations, Employees, Subcontractors]
        });
        res.render(path.join('attendance', 'monthly'), {
            attendance,
            startDate,
            endDate,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error fetching monthly attendance: ' + error.message);
        res.status(500).send('Internal Server Error');
    }
};

router.get('/fetch/attendance/:id', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const attendance = await Attendances.findAll({
            where: { id: req.params.id },
            order: [['createdAt', 'ASC']],
        });

        res.json({ attendance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

router.post('/attendance/create', createAttendance);
router.post('/attendance/edit/:attendance', updateAttendance);
router.post('/attendance/delete/:attendance', deleteAttendance);

router.get('/attendance/daily/:date?', getDailyAttendance);
router.get('/attendance/weekly/:startDate?', getWeeklyAttendance);
router.get('/attendance/monthly/:year?/:month?', getMonthlyAttendance);

module.exports = router;