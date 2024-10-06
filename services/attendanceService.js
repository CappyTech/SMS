const { Op } = require('sequelize');
const moment = require('moment');
const logger = require('./loggerService');
const Attendance = require('../models/attendance'); // Adjust the path as necessary
const Employee = require('../models/employee'); // Adjust the path as necessary
const Subcontractor = require('../models/subcontractor'); // Adjust the path as necessary
const Location = require('../models/location'); // Adjust the path as necessary

const getAttendanceForDay = async (date, include) => {
    try {
        const attendanceRecords = await Attendance.findAll({
            where: {
                date: date
            },
            include: include
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
const getAttendanceForWeek = async (startDate, endDate) => {
    try {
        const attendanceRecords = await Attendance.findAll({
            where: {
                date: {
                    [Op.between]: [startDate.toDate(), endDate.toDate()]
                }
            },
            include: [
                { model: Employee },
                { model: Subcontractor },
                { model: Location }
            ],
            order: [['date', 'ASC'], ['Employee', 'name', 'ASC']]
        });

        return attendanceRecords;
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
const groupAttendanceByPerson = (attendanceRecords) => {
    const grouped = {};

    attendanceRecords.forEach((record) => {
        const personName = record.Employee ? record.Employee.name : record.Subcontractor.company;

        if (!grouped[personName]) {
            grouped[personName] = {};
        }

        const formattedDate = moment(record.date).format('YYYY-MM-DD');
        grouped[personName][formattedDate] = {
            holidays_taken: record.holidays_taken || 0,
            days_without_work: record.days_without_work || 0,
            location: record.Location ? `${record.Location.address}, ${record.Location.city}, ${record.Location.postalCode}` : 'Office'
        };
    });

    return grouped;
};

module.exports = {
    getAttendanceForWeek,
    groupAttendanceByPerson,
    getAttendanceForDay,
};