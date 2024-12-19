const moment = require('moment');

/**
 * Formats a given date string into a specified format.
 * 
 * @param {string|null|undefined} dateString - The date string to format.
 * @param {boolean} [includeTime=false] - Whether to include the time in the formatted string.
 * @param {boolean} [forDateInput=false] - Whether to format the date for an input[type="date"] field.
 * @returns {string} - The formatted date string, or 'Invalid date' if the input is not valid.
 */
function slimDateTime(dateString, includeTime = false, forDateInput = false) {
    if (!dateString) {
        return 'N/A'; // Handle null or undefined dates
    }

    const date = moment.utc(dateString);

    if (!date.isValid()) {
        return 'Is not a valid date'; // Handle invalid date strings
    }

    if (forDateInput) {
        return date.format('YYYY-MM-DD'); // Return in the format needed for input[type="date"]
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
