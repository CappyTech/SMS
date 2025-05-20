const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const path = require('path');
const logger = require('../services/loggerService');
const attendanceService = require('../services/attendanceService');
const authService = require('../services/authService');
const taxService = require('../services/taxService');

const getWeeklyAttendance = async (req, res, next) => {
    try {
        const year = req.params.year ? parseInt(req.params.year) : taxService.getCurrentTaxYear();
        const { start: startOfTaxYear } = taxService.getTaxYearStartEnd(year);
        const taxYearStart = moment.tz(startOfTaxYear, 'Do MMMM YYYY', 'Europe/London');

        // ✅ Set first payroll week to the first Saturday of the tax year
        let firstPayrollWeekStart = taxYearStart.clone().day(6);
        if (firstPayrollWeekStart.isBefore(taxYearStart)) {
            firstPayrollWeekStart.add(7, 'days');
        }

        const today = moment.tz('Europe/London');
        const requestedWeekNumber = req.params.week ? parseInt(req.params.week) : today.diff(firstPayrollWeekStart, 'weeks') + 1;
        const payrollWeekStart = firstPayrollWeekStart.clone().add((requestedWeekNumber - 1) * 7, 'days');
        const endDate = payrollWeekStart.clone().add(6, 'days');

        const previousWeek = requestedWeekNumber === 1 ? 52 : requestedWeekNumber - 1;
        const previousYear = requestedWeekNumber === 1 ? year - 1 : year;
        const nextWeek = requestedWeekNumber === 52 ? 1 : requestedWeekNumber + 1;
        const nextYear = requestedWeekNumber === 52 ? year + 1 : year;

        const {
            attendanceRecords,
            employeeCount,
            subcontractorCount,
            allEmployees,
            allSubcontractors,
            paidReceipts
        } = await attendanceService.getAttendanceForWeek(payrollWeekStart, endDate);

        const {
            groupedAttendance,
            totalEmployeeHours,
            totalEmployeePay,
            totalSubcontractorPay,
            daysOfWeek
        } = attendanceService.groupAttendanceByPerson(
            attendanceRecords,
            payrollWeekStart,
            endDate,              // ✅ Add this missing argument
            allEmployees,
            allSubcontractors,
            paidReceipts
        );    

        // ✅ Render the updated weekly attendance view
        res.render(path.join('attendance', 'weekly'), {
            moment,
            groupedAttendance,
            startDate: payrollWeekStart.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            previousYear,
            previousWeek,
            nextYear,
            nextWeek,
            employeeCount,
            subcontractorCount,
            totalEmployeePay,
            totalEmployeeHours,
            totalSubcontractorPay,
            currentTab: 'weekly',
            daysOfWeek,
        });
    } catch (error) {
        logger.error('Error fetching weekly attendance: ' + error.message);
        req.flash('error', 'Error fetching weekly attendance: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

// ✅ Redirect `/attendance/weekly` to the current week's attendance
router.get('/weekly', authService.ensureAuthenticated, authService.ensureRole('admin'), (req, res, next) => {
    try {
        const currentTaxYear = taxService.getCurrentTaxYear();
        const { start: startOfTaxYear } = taxService.getTaxYearStartEnd(currentTaxYear);
        const taxYearStart = moment.tz(startOfTaxYear, 'Do MMMM YYYY', 'Europe/London');

        // ✅ Ensure first payroll week starts on a Saturday
        let firstPayrollWeekStart = taxYearStart.clone().day(6);
        if (firstPayrollWeekStart.isBefore(taxYearStart)) {
            firstPayrollWeekStart.add(7, 'days');
        }

        const currentWeekNumber = momentTZ.tz('Europe/London').diff(firstPayrollWeekStart, 'weeks') + 1;

        logger.info(`Redirecting to current weekly attendance: Year: ${currentTaxYear}, Week Number: ${currentWeekNumber}`);
        return res.redirect(`/attendance/weekly/${currentTaxYear}/${currentWeekNumber}`);
    } catch (error) {
        logger.error('Error redirecting to current weekly attendance: ' + error.message);
        req.flash('error', 'Error redirecting to current weekly attendance: ' + error.message);
        next(error);
    }
});

router.get('/weekly/:year?/:week?', authService.ensureAuthenticated, authService.ensureRole('admin'), getWeeklyAttendance);

module.exports = router;