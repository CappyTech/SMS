const moment = require('moment');

/**
 * Formats a given date string into a specified format.
 * 
 * @param {string} dateString - The date string to format.
 * @param {boolean} [includeTime=false] - Whether to include the time in the formatted string.
 * @param {boolean} [forDateInput=false] - Whether to format the date for an input[type="date"] field.
 * @returns {string} - The formatted date string.
 */
function slimDateTime(dateString, includeTime = false, forDateInput = false) {
    const date = moment.utc(dateString);

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