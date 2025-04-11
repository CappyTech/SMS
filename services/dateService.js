const moment = require('moment-timezone');

/**
 * Formats a given date string into a specified format.
 * 
 * @param {string|null|undefined} dateString - The date string to format.
 * @param {boolean} [includeTime=false] - Whether to include the time in the formatted string.
 * @param {boolean} [forDateInput=false] - Whether to format the date for an input[type="date"] field.
 * @param {string} [timezone='Europe/London'] - Timezone to format in (default is UK local time).
 * @returns {string} - The formatted date string, or 'Invalid date' if the input is not valid.
 */
function slimDateTime(dateString, includeTime = false, forDateInput = false, timezone = 'Europe/London') {
    if (!dateString) {
        return 'N/A';
    }

    const date = moment.tz(dateString, timezone);

    if (!date.isValid()) {
        return 'Invalid date';
    }

    if (forDateInput) {
        return date.format('YYYY-MM-DD');
    }

    const formattedDate = date.format('DD/MM/YYYY');

    if (includeTime) {
        const formattedTime = date.format('HH:mm');
        return `${formattedDate} ${formattedTime}`;
    }

    return formattedDate;
}

module.exports = {
    slimDateTime
};
