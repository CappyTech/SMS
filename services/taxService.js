const moment = require('moment-timezone');

/**
 * Gets the current tax year based on the UK timezone.
 * The tax year starts on April 6th.
 * 
 * @returns {number} - The current tax year.
 */
function getCurrentTaxYear() {
    const today = moment.tz('Europe/London');
    const startOfTaxYear = moment.tz({ month: 3, day: 6 }, 'Europe/London'); // April 6th
    return today.isBefore(startOfTaxYear) ? startOfTaxYear.subtract(1, 'years').year() : startOfTaxYear.year();
}

/**
 * Gets the start and end dates of a specified tax year.
 * 
 * @param {number} year - The tax year.
 * @param {string} [format='Do MMMM YYYY'] - The date format.
 * @returns {Object} - The start and end dates of the tax year.
 */
function getTaxYearStartEnd(year, format = 'Do MMMM YYYY') {
    const startOfTaxYear = moment.tz({ year, month: 3, day: 6 }, 'Europe/London');
    const endOfTaxYear = startOfTaxYear.clone().add(11, 'months').endOf('month');
    return { start: startOfTaxYear.format(format), end: endOfTaxYear.format(format) };
}

/**
 * Gets the current monthly return period.
 * 
 * @param {number} year - The tax year.
 * @param {number} month - The month (1-12).
 * @returns {Object} - The monthly return period details.
 */
function getCurrentMonthlyReturn(year, month) {
    const startOfTaxYear = moment.tz({ year, month: 3, day: 6 }, 'Europe/London');
    const startOfPeriod = startOfTaxYear.clone().add(month - 1, 'months');
    const endOfPeriod = startOfPeriod.clone().endOf('month');
    const today = moment.tz('Europe/London');

    const submissionDeadline = endOfPeriod.clone().add(6, 'days'); // 11th of the next month
    const hmrcUpdateDate = endOfPeriod.clone().add(11, 'days'); // 16th of the next month

    return {
        periodStart: startOfPeriod.format('YYYY-MM-DD'),
        periodEnd: endOfPeriod.format('YYYY-MM-DD'),
        periodStartDisplay: startOfPeriod.format('Do MMMM YYYY'),
        periodEndDisplay: endOfPeriod.format('Do MMMM YYYY'),
        submissionDeadline: submissionDeadline.format('Do MMMM YYYY'),
        hmrcUpdateDate: hmrcUpdateDate.format('Do MMMM YYYY'),
        submissionDeadlineInDays: submissionDeadline.diff(today, 'days'),
        hmrcUpdateDateInDays: hmrcUpdateDate.diff(today, 'days'),
    };
}

/**
 * Calculates the tax year and tax month for a given date.
 * 
 * @param {string} date - The date in 'YYYY-MM-DD' format.
 * @returns {Object} - The tax year and tax month.
 */
const calculateTaxYearAndMonth = (date) => {
    if (!date || !moment.utc(date, 'YYYY-MM-DD', true).isValid()) {
        return { taxYear: null, taxMonth: null, error: "Invalid date format" };
    }

    const remittanceMoment = moment.tz(date, 'Europe/London');
    const year = remittanceMoment.year();
    const startOfTaxYear = moment.tz(`${year}-04-06`, 'Europe/London');
    const taxYear = remittanceMoment.isBefore(startOfTaxYear) ? year - 1 : year;
    const taxMonth = remittanceMoment.diff(startOfTaxYear, 'months') + 1;

    return { taxYear, taxMonth };
};

module.exports = {
    getCurrentTaxYear,
    getTaxYearStartEnd,
    getCurrentMonthlyReturn,
    calculateTaxYearAndMonth,
};
