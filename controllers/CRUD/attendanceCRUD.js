const express = require('express');
const router = express.Router();
const Attendances = require('../../models/attendance');
const Locations = require('../../models/location');
const Employees = require('../../models/employee');
const Subcontractors = require('../../models/subcontractor');
const Invoices = require('../../models/invoice');
const moment = require('moment');
const { Op } = require('sequelize');
const helpers = require('../../helpers');
const path = require('path');
const logger = require('../../services/loggerService');
const attendanceService = require('../../services/attendanceService');
const authService = require('../../services/authService');
const taxService = require('../../services/taxService');

const createAttendance = async (req, res) => {
    try {
        const {
            date,
            locationId,
            employeeId,
            subcontractorId,
            type,
            hoursWorked,
        } = req.body;

        await Attendances.create({
            date,
            locationId,
            employeeId: employeeId || null,
            subcontractorId: subcontractorId || null,
            type,
            hoursWorked,
        });

        req.flash('success', 'Attendance record created successfully.');
        res.redirect('/dashboard/attendance');
    } catch (error) {
        logger.error('Error creating attendance: ' + error.message);
        req.flash('error', 'Failed to create attendance.');
        res.redirect('/dashboard/attendance');
    }
};

const readAttendance = async (req, res) => {
    try {
        // Fetch the attendance record by primary key (ID) with associations
        const attendance = await Attendances.findByPk(req.params.attendance, {
            include: [
                { model: Employees },  // Include Employee details if associated
                { model: Subcontractors }, // Include Subcontractor details if associated
                { model: Locations } // Include Location details
            ]
        });

        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        // Render the viewAttendance template
        res.render(path.join('attendance', 'viewAttendance'), {
            title: 'Attendance',
            attendance,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        logger.error('Error viewing attendance: ' + error.message);
        req.flash('error', 'Error viewing attendance: ' + error.message);
        res.redirect('/error');
    }
};

const updateAttendance = async (req, res) => {
    try {
        const { attendance } = req.params;
        const {
            date,
            locationId,
            employeeId,
            subcontractorId,
            hoursWorked,
            type,
        } = req.body;

        // Convert employeeId and subcontractorId values to null if 'null' is passed as a string or if undefined
        const updatedEmployeeId = employeeId === 'null' || !employeeId ? null : employeeId;
        const updatedSubcontractorId = subcontractorId === 'null' || !subcontractorId ? null : subcontractorId;

        // Set locationId to null if it's not provided or set to 'null'
        const updatedLocationId = locationId === 'null' || !locationId ? null : locationId;

        // Validation: ensure that either employeeId or subcontractorId is set, not both at the same time
        if (updatedEmployeeId && updatedSubcontractorId) {
            req.flash('error', 'Please select either an employee or a subcontractor, but not both.');
            return res.redirect(`/attendance/edit/${attendance}`);
        }

        // Validation: If employeeId is set, it must exist in the Employees table
        if (updatedEmployeeId) {
            const employeeExists = await Employees.findByPk(updatedEmployeeId);
            if (!employeeExists) {
                req.flash('error', 'Invalid Employee ID. Please select a valid employee.');
                return res.redirect(`/attendance/edit/${attendance}`);
            }
        }

        // Validation: If subcontractorId is set, it must exist in the Subcontractors table
        if (updatedSubcontractorId) {
            const subcontractorExists = await Subcontractors.findByPk(updatedSubcontractorId);
            if (!subcontractorExists) {
                req.flash('error', 'Invalid Subcontractor ID. Please select a valid subcontractor.');
                return res.redirect(`/attendance/edit/${attendance}`);
            }
        }

        // If locationId is provided and not null, validate its existence in the Locations table
        if (updatedLocationId) {
            const locationExists = await Locations.findByPk(updatedLocationId);
            if (!locationExists) {
                req.flash('error', 'Invalid Location ID. Please select a valid location.');
                return res.redirect(`/attendance/edit/${attendance}`);
            }
        }

        // Update the attendance record with validated values
        await Attendances.update(
            {
                date,
                locationId: updatedLocationId, // Set the validated or null location ID
                employeeId: updatedEmployeeId, // Set the validated or null employee ID
                subcontractorId: updatedSubcontractorId, // Set the validated or null subcontractor ID
                hoursWorked: updatedEmployeeId ? hoursWorked : null, // Set hoursWorked only if it's an employee
                type,
            },
            { where: { id: attendance } }
        );

        req.flash('success', 'Attendance record updated successfully.');
        res.redirect('/dashboard/attendance');
    } catch (error) {
        logger.error('Error updating attendance: ' + error.message);
        req.flash('error', `Failed to update attendance: ${error.message}`);
        res.redirect(`/attendance/edit/${attendance}`);
    }
};


const deleteAttendance = async (req, res) => {
    try {
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
    const date = req.params.date || moment().format('YYYY-MM-DD'); // Default to today
    try {
        const attendance = attendanceService.getAttendanceForDay(date,[Locations, Employees, Subcontractors]);
        
        res.render(path.join('attendance', 'daily'), {
            moment,
            attendance,
            date,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            currentTab: 'daily'
        });
    } catch (error) {
        logger.error('Error fetching daily attendance: ' + error.message);
        req.flash('error', 'Error fetching daily attendance: ' + error.message);
        return res.redirect('/');
    }
};

const getWeeklyAttendance = async (req, res) => {
    try {
        const year = req.params.year ? parseInt(req.params.year) : taxService.getCurrentTaxYear();
        const { start: startOfTaxYear } = helpers.getTaxYearStartEnd(year);
        const taxYearStart = moment.utc(startOfTaxYear, 'Do MMMM YYYY');
        let firstPayrollWeekStart = taxYearStart.clone().day(1); 
        if (firstPayrollWeekStart.isBefore(taxYearStart)) {
            firstPayrollWeekStart.add(7, 'days');
        }
        const today = moment.utc();
        const requestedWeekNumber = req.params.week ? parseInt(req.params.week) : today.diff(firstPayrollWeekStart, 'weeks') + 1;
        const payrollWeekStart = firstPayrollWeekStart.clone().add((requestedWeekNumber - 1) * 7, 'days');
        const endDate = payrollWeekStart.clone().add(6, 'days');
        const previousWeek = requestedWeekNumber === 1 ? 52 : requestedWeekNumber - 1;
        const previousYear = requestedWeekNumber === 1 ? year - 1 : year;
        const nextWeek = requestedWeekNumber === 52 ? 1 : requestedWeekNumber + 1;
        const nextYear = requestedWeekNumber === 52 ? year + 1 : year;

        const {
            attendanceRecords,
            subcontractorInvoices,
            employeeCount,
            subcontractorCount,
            allEmployees,
        } = await attendanceService.getAttendanceForWeek(payrollWeekStart, endDate);

        const {
            groupedAttendance,
            totalEmployeeHours,
            totalEmployeePay,
            totalSubcontractorPay,
            daysOfWeek,
        } = attendanceService.groupAttendanceByPerson(attendanceRecords, subcontractorInvoices, payrollWeekStart, endDate, allEmployees);
    /*
        const totalEmployeePay = attendance
            .filter(a => a.employeeId !== null && a.hoursWorked !== null && a.Employee) // Ensure Employee is loaded
            .reduce((sum, record) => sum + (parseFloat(record.hoursWorked) * parseFloat(record.Employee.hourlyRate)), 0);

        // Group attendance records by person and date.
        const groupedAttendance = {};
        let totalEmployeeHours = 0;
        let totalSubcontractorPay = 0;

        attendance.forEach(record => {
            const personName = record.Employee ? record.Employee.name : record.Subcontractor.company;

            if (!groupedAttendance[personName]) {
                groupedAttendance[personName] = {
                    employeeId: record.Employee ? record.Employee.id : null,
                    subcontractorId: record.Subcontractor ? record.Subcontractor.id : null,
                    totalHoursWorked: 0,
                    totalPay: 0,
                    weeklyPay: 0,
                    dailyRecords: {},
                    invoices: {}
                };
            }

            const dateKey = moment(record.date).format('YYYY-MM-DD');

            if (!groupedAttendance[personName].dailyRecords[dateKey]) {
                groupedAttendance[personName].dailyRecords[dateKey] = {};
            }

            // Convert hoursWorked to a number
            const hoursWorked = parseFloat(record.hoursWorked) || 0;
            const hourlyRate = record.Employee ? parseFloat(record.Employee.hourlyRate) || 0 : 0;
            
            // Log debug information for troubleshooting
            logger.info(`Debug - Employee Name: ${personName}`);
            logger.info(`Debug - Hours Worked: ${hoursWorked}, Hourly Rate: £${hourlyRate}, Type of Hours Worked: ${typeof hoursWorked}, Type of Hourly Rate: ${typeof hourlyRate}`);

            const calculatedWeeklyPay = hoursWorked * hourlyRate;

            logger.info(`Debug - Calculated Weekly Pay: £${calculatedWeeklyPay}`);

            groupedAttendance[personName].dailyRecords[dateKey][record.id] = {
                location: record.Location,
                type: record.type,
                hoursWorked: hoursWorked,
                weeklyPay: calculatedWeeklyPay
            };

            if (record.Employee) {
                groupedAttendance[personName].totalHoursWorked += hoursWorked;
                groupedAttendance[personName].weeklyPay += calculatedWeeklyPay;
                totalEmployeeHours += hoursWorked;
            } else if (record.Subcontractor) {
                groupedAttendance[personName].totalPay += record.Subcontractor.invoiceAmount || 0;
                groupedAttendance[personName].weeklyPay += record.Subcontractor.invoiceAmount || 0;
            }
        });

        // Attach invoices to the corresponding subcontractor in groupedAttendance.
        subcontractorInvoices.forEach(invoice => {
            const personName = invoice.Subcontractor.company;
            const dateKey = moment(invoice.invoiceDate).format('YYYY-MM-DD');

            if (groupedAttendance[personName]) {
                if (!groupedAttendance[personName].invoices[dateKey]) {
                    groupedAttendance[personName].invoices[dateKey] = [];
                }

                groupedAttendance[personName].invoices[dateKey].push(invoice);
                groupedAttendance[personName].totalPay += invoice.netAmount;
                groupedAttendance[personName].weeklyPay += invoice.netAmount;
                totalSubcontractorPay += invoice.netAmount;
            }
        });

        console.log('Grouped Attendance:', JSON.stringify(groupedAttendance, null, 2));

        const daysOfWeek = [];
        for (let i = 0; i < 7; i++) {
            daysOfWeek.push(payrollWeekStart.clone().add(i, 'days').format('YYYY-MM-DD'));
        }
    */
        // Render the updated weekly attendance view with the payroll week data.
        res.render(path.join('attendance', 'weekly'), {
            moment,
            groupedAttendance,
            startDate: payrollWeekStart.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
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
        return res.redirect('/');
    }
};

const getMonthlyAttendance = async (req, res) => {
    // Determine the current tax year and month using helper functions
    const year = req.params.year ? parseInt(req.params.year) : helpers.getCurrentTaxYear();
    const month = req.params.month ? parseInt(req.params.month) : moment().month() + 1; // Default to current month (1-based)

    // Get the start and end date for the selected month in the context of the UK tax year
    const { periodStart, periodEnd, periodStartDisplay, periodEndDisplay } = helpers.getCurrentMonthlyReturn(year, month);

    // Calculate previous and next month/year values
    const previousPeriod = moment(periodStart).subtract(1, 'months');
    const nextPeriod = moment(periodStart).add(1, 'months');

    const previousYear = previousPeriod.year();
    const previousMonth = previousPeriod.month() + 1; // month() is 0-based, so add 1 to get 1-based month
    const nextYear = nextPeriod.year();
    const nextMonth = nextPeriod.month() + 1; // month() is 0-based, so add 1 to get 1-based month

    try {
        // Fetch attendance records within the period range
        const attendance = await Attendances.findAll({
            where: {
                date: {
                    [Op.between]: [periodStart, periodEnd]
                }
            },
            include: [Locations, Employees, Subcontractors],
            order: [['date', 'ASC']]
        });

        // Group attendance records by person and date
        const groupedAttendance = {};
        let totalEmployeeHours = 0;
        let totalSubcontractorPay = 0;

        attendance.forEach(record => {
            const personName = record.Employee ? record.Employee.name : record.Subcontractor.company;

            if (!groupedAttendance[personName]) {
                groupedAttendance[personName] = {
                    employeeId: record.Employee ? record.Employee.id : null,
                    subcontractorId: record.Subcontractor ? record.Subcontractor.id : null,
                    totalHoursWorked: 0,
                    monthlyPay: 0, // Initialize monthlyPay for both employees and subcontractors
                    dailyRecords: {} // Store records by day
                };
            }

            const dateKey = moment(record.date).format('YYYY-MM-DD');

            if (!groupedAttendance[personName].dailyRecords[dateKey]) {
                groupedAttendance[personName].dailyRecords[dateKey] = {};
            }

            groupedAttendance[personName].dailyRecords[dateKey][record.id] = {
                location: record.Location,
                type: record.type,
                hoursWorked: record.hoursWorked,
                monthlyPay: record.Employee ? record.hoursWorked * record.Employee.hourlyRate : 0 // Calculate monthlyPay for employees
            };

            if (record.Employee) {
                groupedAttendance[personName].totalHoursWorked += record.hoursWorked || 0;
                groupedAttendance[personName].monthlyPay += (record.hoursWorked || 0) * record.Employee.hourlyRate;
                totalEmployeeHours += record.hoursWorked || 0;
            } else if (record.Subcontractor) {
                groupedAttendance[personName].monthlyPay += record.Subcontractor.invoiceAmount || 0;
                totalSubcontractorPay += record.Subcontractor.invoiceAmount || 0;
            }
        });

        // Group days into weeks for the selected month based on the UK tax year weeks
        const weeksOfMonth = [];
        let week = [];
        const startOfWeek = moment(periodStart).startOf('week');
        const endOfWeek = moment(periodEnd).endOf('week');
        let currentDay = startOfWeek;

        while (currentDay.isBefore(endOfWeek) || currentDay.isSame(endOfWeek, 'day')) {
            week.push(currentDay.format('YYYY-MM-DD'));
            if (currentDay.day() === 0 || currentDay.isSame(endOfWeek, 'day')) { // End of the week (Sunday) or end of period
                weeksOfMonth.push({ days: week });
                week = [];
            }
            currentDay = currentDay.add(1, 'days');
        }

        // Render the updated monthly attendance view with grouped attendance data and monthly summary
        res.render(path.join('attendance', 'monthly'), {
            moment,
            groupedAttendance,
            weeksOfMonth,
            startDate: periodStart,
            endDate: periodEnd,
            periodStartDisplay,
            periodEndDisplay,
            previousYear,
            previousMonth,
            nextYear,
            nextMonth,
            totalEmployeeHours,
            totalSubcontractorPay,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            currentTab: 'monthly'
        });
    } catch (error) {
        logger.error('Error fetching monthly attendance: ' + error.message);
        req.flash('error', 'Error fetching monthly attendance: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/fetch/attendance/:id', authService.ensureAuthenticated, async (req, res) => {
    try {
        const attendance = await Attendances.findAll({
            where: { id: req.params.id },
            order: [['createdAt', 'ASC']],
        });

        res.json({ attendance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

router.post('/attendance/create', authService.ensureAuthenticated, createAttendance);
router.get('/attendance/read/:attendance', authService.ensureAuthenticated, readAttendance);
router.post('/attendance/update/:attendance', authService.ensureAuthenticated, updateAttendance);
router.post('/attendance/delete/:attendance', authService.ensureAuthenticated, deleteAttendance);
router.get('/attendance/weekly', authService.ensureAuthenticated, (req, res) => {
    try {
        // Calculate the current tax year
        const currentTaxYear = taxService.getCurrentTaxYear();

        // Get the start of the current tax year and the first payroll week start date
        const { start: startOfTaxYear } = taxService.getTaxYearStartEnd(currentTaxYear);
        const taxYearStart = moment.utc(startOfTaxYear, 'Do MMMM YYYY');
        let firstPayrollWeekStart = taxYearStart.clone().day(1);
        if (firstPayrollWeekStart.isBefore(taxYearStart)) {
            firstPayrollWeekStart.add(7, 'days');
        }

        // Calculate the current week number within the tax year based on the first payroll week
        const currentWeekNumber = moment.utc().diff(firstPayrollWeekStart, 'weeks') + 1;

        // Redirect to the correct weekly attendance page based on the calculated year and week number
        logger.info(`Redirecting to current weekly attendance: Year: ${currentTaxYear}, Week Number: ${currentWeekNumber}`);
        return res.redirect(`/attendance/weekly/${currentTaxYear}/${currentWeekNumber}`);
    } catch (error) {
        logger.error('Error redirecting to current weekly attendance: ' + error.message);
        req.flash('error', 'Error redirecting to current weekly attendance: ' + error.message);
        return res.redirect('/');
    }
});
router.get('/attendance/daily/:date?', authService.ensureAuthenticated, getDailyAttendance);
router.get('/attendance/weekly/:year?/:week?', authService.ensureAuthenticated, getWeeklyAttendance);
router.get('/attendance/monthly/:year?/:month?', authService.ensureAuthenticated, getMonthlyAttendance);

module.exports = router;