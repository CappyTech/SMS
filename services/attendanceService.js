const moment = require('moment');
const logger = require('./loggerService');
const db = require('./sequelizeDatabaseService');
const kf = require('./kashflowDatabaseService');

const getAttendanceForDay = async (date) => {
    try {
        const attendanceRecords = await db.Attendances.findAll({
            where: { date: date },
            include: [db.Employees, db.Locations], // Removed Subcontractors
            order: [['date', 'ASC']]
        });

        return attendanceRecords;
    } catch (error) {
        logger.error('Error fetching attendance records: ' + error);
        throw new Error('Failed to fetch attendance records for the day');
    }
};

/**
 * Fetch attendance records for a given week.
 * @param {Date} startDate - Start date of the week.
 * @param {Date} endDate - End date of the week.
 * @returns {Promise<Object>} - Attendance records and counts.
 */
const getAttendanceForWeek = async (payrollWeekStart, endDate) => {
    try {
        // Fetch attendance records for employees
        const attendanceRecords = await db.Attendances.findAll({
            where: {
                date: {
                    [db.Sequelize.Op.between]: [payrollWeekStart.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                }
            },
            include: [db.Employees, db.Locations], // Removed Subcontractors
            order: [['date', 'ASC']]
        });

        // Fetch all employees
        const allEmployees = await db.Employees.findAll({
            where: { status: 'active' }
        });

        // Fetch subcontractors from a different database (KF_Suppliers)
        const allSubcontractors = await kf.KF_Suppliers.findAll({
            where: { Subcontractor: true }
        });

        return {
            attendanceRecords,
            employeeCount: allEmployees.length,
            subcontractorCount: allSubcontractors.length,
            allEmployees,
            allSubcontractors
        };
    } catch (error) {
        logger.error('Error fetching attendance records: ' + error);
        throw new Error('Failed to fetch attendance records for the week');
    }
};

/**
 * Group attendance records by person.
 * @param {Array} attendanceRecords - Array of attendance records.
 * @param {Date} payrollWeekStart - Start date of the week.
 * @param {Date} endDate - End date of the week.
 * @param {Array} allEmployees - Array of employees.
 * @param {Array} allSubcontractors - Array of subcontractors from KF_Suppliers.
 * @returns {Object} - Grouped attendance records.
 */
const groupAttendanceByPerson = (attendanceRecords, payrollWeekStart, endDate, allEmployees, allSubcontractors) => {
    const totalEmployeePay = attendanceRecords
        .filter(a => a.employeeId !== null && a.hoursWorked !== null && a.Employee) // Ensure Employee is loaded
        .reduce((sum, record) => sum + (parseFloat(record.hoursWorked) * parseFloat(record.Employee.hourlyRate)), 0);

    const groupedAttendance = {};
    let totalEmployeeHours = 0;
    let totalSubcontractorPay = 0;

    // Initialize groupedAttendance with all employees
    allEmployees.forEach(employee => {
        groupedAttendance[employee.name] = {
            employeeId: employee.id,
            subcontractorId: null,
            totalHoursWorked: 0,
            totalPay: 0,
            weeklyPay: 0,
            dailyRecords: {}
        };
    });

    // Initialize subcontractors from KF_Suppliers
    allSubcontractors.forEach(subcontractor => {
        groupedAttendance[subcontractor.Name] = {
            employeeId: null,
            subcontractorId: subcontractor.id,
            totalHoursWorked: 0,
            totalPay: 0,
            weeklyPay: 0,
            dailyRecords: {}
        };
    });

    attendanceRecords.forEach(record => {
        const personName = record.Employee ? record.Employee.name : null;

        if (!personName) return; // Skip if no valid personName

        if (!groupedAttendance[personName]) {
            groupedAttendance[personName] = {
                employeeId: record.Employee ? record.Employee.id : null,
                subcontractorId: null,
                totalHoursWorked: 0,
                totalPay: 0,
                weeklyPay: 0,
                dailyRecords: {}
            };
        }

        const dateKey = moment(record.date).format('YYYY-MM-DD');

        if (!groupedAttendance[personName].dailyRecords[dateKey]) {
            groupedAttendance[personName].dailyRecords[dateKey] = {};
        }

        // Convert hoursWorked to a number
        const hoursWorked = parseFloat(record.hoursWorked) || 0;
        const hourlyRate = record.Employee ? parseFloat(record.Employee.hourlyRate) || 0 : 0;
        const calculatedWeeklyPay = hoursWorked * hourlyRate;

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
        }
    });

    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
        daysOfWeek.push(payrollWeekStart.clone().add(i, 'days').format('YYYY-MM-DD'));
    }

    return {
        groupedAttendance,
        totalEmployeeHours,
        totalEmployeePay,
        totalSubcontractorPay,
        daysOfWeek
    };
};

module.exports = {
    getAttendanceForWeek,
    groupAttendanceByPerson,
    getAttendanceForDay
};