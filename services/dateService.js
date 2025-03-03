const momentTz = require('moment-timezone');

/**
 * Formats a given date string into a specified format.
 * 
 * @param {string|null|undefined} dateString - The date string to format.
 * @param {boolean} [includeTime=false] - Whether to include the time in the formatted string.
 * @param {boolean} [forDateInput=false] - Whether to format the date for an input[type="date"] field.
 * @param {string} [timezone='Europe/London'] - The timezone to use for formatting.
 * @returns {string|null} - The formatted date string, or `null` if the input is invalid.
 */
function slimDateTime(dateString, includeTime = false, forDateInput = false, timezone = 'Europe/London') {
    if (!dateString) {
        return forDateInput ? '' : null; // Use `''` for input fields, `null` otherwise
    }

    const date = momentTz.tz(dateString, ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM/DD/YYYY'], true, timezone);

    if (!date.isValid()) {
        return 'Invalid date';
    }

    if (forDateInput) {
        return date.format('YYYY-MM-DD'); // Format for input fields
    }

    const formattedDate = date.format('DD/MM/YYYY');

    return includeTime ? `${formattedDate} ${date.format('HH:mm')}` : formattedDate;
}

module.exports = {
    slimDateTime
};
