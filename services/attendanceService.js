const { Op } = require('sequelize');
const moment = require('moment');
const logger = require('./loggerService');
const Attendances = require('../models/attendance');
const Employees = require('../models/employee');
const Subcontractors = require('../models/subcontractor');
const Invoices = require('../models/invoice');
const Locations = require('../models/location');

const getAttendanceForDay = async (date) => {
    try {
        const attendanceRecords = await Attendances.findAll({
            where: {
                date: date
            },
            include: [Employees, Subcontractors, Locations],
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
 * @returns {Promise<Array>} - Array of attendance records.
 */
const getAttendanceForWeek = async (payrollWeekStart, endDate) => {
    try {
        const attendanceRecords = await Attendances.findAll({
            where: {
                date: {
                    [Op.between]: [payrollWeekStart.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                }
            },
            include: [Employees, Subcontractors, Locations],
            order: [['date', 'ASC']]
        });
        const subcontractorInvoices = await Invoices.findAll({
            where: {
                invoiceDate: {
                    [Op.between]: [payrollWeekStart.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                }
            },
            include: [Subcontractors]
        });
        const employeeCount = await Attendances.count({
            where: {
                date: {
                    [Op.between]: [payrollWeekStart.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                },
                employeeId: { [Op.not]: null }
            },
            distinct: true,
            col: 'employeeId'
        });
        const subcontractorCount = await Attendances.count({
            where: {
                date: {
                    [Op.between]: [payrollWeekStart.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
                },
                subcontractorId: { [Op.not]: null }
            },
            distinct: true,
            col: 'subcontractorId'
        });

        return {
            attendanceRecords,
            subcontractorInvoices,
            employeeCount,
            subcontractorCount
        };
    } catch (error) {
        logger.error('Error fetching attendance records: ' + error);
        throw new Error('Failed to fetch attendance records for the week');
    }
};

/**
 * Group attendance records by person.
 * @param {Array} attendanceRecords - Array of attendance records.
 * @returns {Object} - Grouped attendance records by person name.
 */
const groupAttendanceByPerson = (attendanceRecords, subcontractorInvoices, payrollWeekStart, endDate) => {
    
    const totalEmployeePay = attendanceRecords
            .filter(a => a.employeeId !== null && a.hoursWorked !== null && a.Employee) // Ensure Employee is loaded
            .reduce((sum, record) => sum + (parseFloat(record.hoursWorked) * parseFloat(record.Employee.hourlyRate)), 0);
    const groupedAttendance = {};
    let totalEmployeeHours = 0;
    let totalSubcontractorPay = 0;

    attendanceRecords.forEach(record => {
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

    logger.info('Grouped Attendance:', JSON.stringify(groupedAttendance, null, 2));

    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
        daysOfWeek.push(payrollWeekStart.clone().add(i, 'days').format('YYYY-MM-DD'));
    }

    return {
        groupedAttendance,
        totalEmployeeHours,
        totalEmployeePay,
        totalSubcontractorPay,
        daysOfWeek,
    };
};

module.exports = {
    getAttendanceForWeek,
    groupAttendanceByPerson,
    getAttendanceForDay,
};