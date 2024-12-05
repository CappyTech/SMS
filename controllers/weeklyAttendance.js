const express = require('express');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const logger = require('../services/loggerService');
const attendanceService = require('../services/attendanceService');
const authService = require('../services/authService');
const taxService = require('../services/taxService');

const getWeeklyAttendance = async (req, res) => {
    try {
        const year = req.params.year ? parseInt(req.params.year) : taxService.getCurrentTaxYear();
        const { start: startOfTaxYear } = taxService.getTaxYearStartEnd(year);
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

router.get('/attendance/weekly/:year?/:week?', authService.ensureAuthenticated, getWeeklyAttendance);

module.exports = router;