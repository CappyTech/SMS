const moment = require('moment');
const axios = require('axios');
const BankHoliday = require('../models/bankHoliday');

/**
 * Fetches bank holiday data from the given URL, checks for changes, and updates the database if necessary.
 * 
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function getBankHoliday() {
    try {
        // Fetch JSON data
        const response = await axios.get('https://www.gov.uk/bank-holidays.json');
        const data = response.data;

        // Extract events from all divisions
        const events = [];
        for (const division in data) {
            data[division].events.forEach(event => {
                events.push({
                    title: event.title,
                    date: event.date,
                    notes: event.notes,
                    bunting: event.bunting,
                    division: division
                });
            });
        }

        // Fetch existing data from the database
        const existingData = await BankHoliday.findAll();

        // Check if data has changed
        const hasChanged = events.some(event => {
            return !existingData.some(existingEvent => 
                existingEvent.title === event.title &&
                existingEvent.date === event.date &&
                existingEvent.notes === event.notes &&
                existingEvent.bunting === event.bunting &&
                existingEvent.division === event.division
            );
        });

        if (hasChanged) {
            // Drop existing data
            await BankHoliday.destroy({ where: {}, truncate: true });

            // Insert new data
            await BankHoliday.bulkCreate(events);
        }
    } catch (error) {
        console.error('Error fetching or updating bank holidays:', error);
    }
}

/**
 * Gets the current tax year based on today's date.
 * The tax year starts on April 6th.
 * 
 * @returns {number} - The current tax year.
 */
function getCurrentTaxYear() {
    const today = moment.utc();
    const startOfTaxYear = moment.utc({ month: 3, day: 6 }); // April 6th
    if (today.isBefore(startOfTaxYear)) {
        return startOfTaxYear.subtract(1, 'years').year();
    }
    return startOfTaxYear.year();
}

/**
 * Gets the start and end dates of a specified tax year.
 * 
 * @param {number} year - The tax year.
 * @returns {Object} - An object containing the start and end dates of the tax year.
 *   - start: The start date of the tax year (6th April).
 *   - end: The end date of the tax year (5th April of the next year).
 */
function getTaxYearStartEnd(year) {
    const startOfTaxYear = moment.utc({ year, month: 3, day: 6 }); // 6th April of the specified year
    const endOfTaxYear = moment.utc(startOfTaxYear).add(1, 'years').subtract(1, 'days'); // 5th April of the next year
    return {
        start: startOfTaxYear.format('Do MMMM YYYY'),
        end: endOfTaxYear.format('Do MMMM YYYY')
    };
}

/**
 * Gets the current monthly return period for a specified tax year and month.
 * 
 * @param {number} year - The tax year.
 * @param {number} month - The month (1-12).
 * @returns {Object} - An object containing the start and end dates of the period, 
 *   submission deadline, HMRC update date, and the number of days until these dates.
 *   - periodStart: The start date of the period (YYYY-MM-DD).
 *   - periodEnd: The end date of the period (YYYY-MM-DD).
 *   - periodStartDisplay: The start date of the period (Do MMMM YYYY).
 *   - periodEndDisplay: The end date of the period (Do MMMM YYYY).
 *   - submissionDeadline: The submission deadline date (Do MMMM YYYY).
 *   - hmrcUpdateDate: The HMRC update date (Do MMMM YYYY).
 *   - submissionDeadlineInDays: The number of days until the submission deadline.
 *   - hmrcUpdateDateInDays: The number of days until the HMRC update date.
 */
function getCurrentMonthlyReturn(year, month) {
    const startOfTaxYear = moment.utc({ year, month: 3, day: 6 });
    const startOfPeriod = moment.utc(startOfTaxYear).add(month - 1, 'months');
    const endOfPeriod = moment.utc(startOfPeriod).add(1, 'months').subtract(1, 'days');
    const today = moment.utc();

    const submissionDeadline = moment.utc(endOfPeriod).add(6, 'days'); // 11th of the next month
    const hmrcUpdateDate = moment.utc(endOfPeriod).add(11, 'days'); // 16th of the next month
    const submissionDeadlineInDays = submissionDeadline.diff(today, 'days');
    const hmrcUpdateDateInDays = hmrcUpdateDate.diff(today, 'days');

    return {
        periodStart: startOfPeriod.format('YYYY-MM-DD'),
        periodEnd: endOfPeriod.format('YYYY-MM-DD'),
        periodStartDisplay: startOfPeriod.format('Do MMMM YYYY'),
        periodEndDisplay: endOfPeriod.format('Do MMMM YYYY'),
        submissionDeadline: submissionDeadline.format('Do MMMM YYYY'),
        hmrcUpdateDate: hmrcUpdateDate.format('Do MMMM YYYY'),
        submissionDeadlineInDays,
        hmrcUpdateDateInDays
    };
}

/**
 * Calculates the tax year and tax month for a given date.
 * 
 * @param {string} date - The date to calculate the tax year and month for.
 * @returns {Object} - An object containing the tax year and tax month.
 *   - taxYear: The tax year.
 *   - taxMonth: The tax month (1-12).
 */
const calculateTaxYearAndMonth = (date) => {
    if (!date) return { taxYear: null, taxMonth: null };

    const remittanceMoment = moment.utc(date);
    const year = remittanceMoment.year();
    const startOfTaxYear = moment.utc(`${year}-04-06T00:00:00Z`);
    const taxYear = remittanceMoment.isBefore(startOfTaxYear) ? year - 1 : year;
    const startOfCurrentTaxYear = remittanceMoment.isBefore(startOfTaxYear) ? moment.utc(`${year - 1}-04-06T00:00:00Z`) : startOfTaxYear;
    const taxMonth = remittanceMoment.diff(startOfCurrentTaxYear, 'months') + 1;

    return { taxYear, taxMonth };
};

module.exports = {
    getCurrentTaxYear,
    getTaxYearStartEnd,
    getCurrentMonthlyReturn,
    calculateTaxYearAndMonth,
};