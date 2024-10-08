const moment = require('moment');
const logger = require('./logger');

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


function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        const errorMessage = 'Invalid input. Amount must be a number.';
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
    return '£' + amount.toFixed(2);
};

// Middleware to ensure authenticated access and clear flash messages
const ensureAuthenticated = (req, res, next) => {
    logger.info(`Session Data: ${JSON.stringify(req.session)}`);
    if (!req.session.user) {
        req.flash('error', 'Please sign in.');
        logger.info(`Unknown user accessed path ${req.method} ${req.originalUrl}`);
        return res.redirect('/signin');
    }
    res.locals.errorMessages = req.flash('error');
    res.locals.successMessages = req.flash('success');
    next();
};

// Middleware to handle role-based access
const ensureRole = (roles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.flash('error', 'Please sign in.');
            return res.redirect('/signin');
        }
        // Check if user's role is in the list of allowed roles
        if (!roles.includes(req.session.user.role)) {
            req.flash('error', 'Access denied | You do not have the correct role.');
            return res.redirect('/');
        }
        next();
    };
};

// Middleware to handle permission-based access
const ensurePermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.flash('error', 'Please sign in.');
            return res.redirect('/signin');
        }

        // Check if user has at least one of the required permissions
        const userPermissions = req.session.user;
        const hasPermission = requiredPermissions.every(permission => userPermissions[permission]);

        if (!hasPermission) {
            req.flash('error', 'Access denied | You do not have the correct permissions.');
            return res.redirect('/');
        }
        next();
    };
};

function validateInvoiceData(data) {
    const errors = [];
    const validations = {
        invoiceNumber: value => value && value.trim() !== '',
        kashflowNumber: value => value && value.trim() !== '',
        invoiceDate: value => value && !isNaN(Date.parse(value)),
        remittanceDate: value => !value || !isNaN(Date.parse(value)),
        labourCost: value => !isNaN(value) && Number(value) >= 0,
        materialCost: value => !isNaN(value) && Number(value) >= 0,
    };

    // Run the validations
    Object.keys(validations).forEach(field => {
        if (!validations[field](data[field])) {
            errors.push(`Invalid or missing value for ${field}`);
        }
    });

    // Handle submissionDate, allowing it to be null
    if (data.submissionDate === '0000-00-00 00:00:00' || !data.submissionDate) {
        data.submissionDate = null;
    }

    // Handle remittanceDate, allowing it to be null
    if (data.remittanceDate === '0000-00-00 00:00:00' || !data.remittanceDate) {
        data.remittanceDate = null;
    }

    // If there are validation errors, log them and throw an error with details
    if (errors.length > 0) {
        const errorMessage = errors.join(', ');
        logger.error(`Validation errors: ${errorMessage}`);
        throw new Error(errorMessage);
    }

    // Return validated data
    return data;
}

function calculateInvoiceAmounts(labourCost, materialCost, deduction, cisNumber, isGross, isReverseCharge) {
    labourCost = parseFloat(labourCost);
    materialCost = parseFloat(materialCost);

    const grossAmount = labourCost + materialCost;
    let cisRate, reverseCharge;

    if (deduction === 0) {
        cisRate = 0.0;
    } else if (cisNumber && deduction === 0.2) {
        cisRate = 0.2;
    } else {
        cisRate = 0.3;
    }

    const cisAmount = labourCost * cisRate;
    const cisAmountZero = labourCost * 0.0;
    const cisAmountTwo = labourCost * 0.2;
    const cisAmountThree = labourCost * 0.3;
    const netAmount = grossAmount - cisAmount;
    reverseCharge = grossAmount * 0.2;

    return {
        cisRate,
        grossAmount: grossAmount.toFixed(2),
        cisAmount: cisAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        reverseCharge: reverseCharge.toFixed(2),
        cisAmountZero: cisAmountZero.toFixed(2),
        cisAmountTwo: cisAmountTwo.toFixed(2),
        cisAmountThree: cisAmountThree.toFixed(2),
    };
};

function rounding(number, up) {
    return up ? Math.ceil(number) : Math.floor(number);
};

function getCurrentTaxYear() {
    const today = moment.utc();
    const startOfTaxYear = moment.utc({ month: 3, day: 6 }); // April 6th
    if (today.isBefore(startOfTaxYear)) {
        return startOfTaxYear.subtract(1, 'years').year();
    }
    return startOfTaxYear.year();
};

function getTaxYearStartEnd(year) {
    const startOfTaxYear = moment.utc({ year, month: 3, day: 6 }); // 6th April of the specified year
    const endOfTaxYear = moment.utc(startOfTaxYear).add(1, 'years').subtract(1, 'days'); // 5th April of the next year
    return {
        start: startOfTaxYear.format('Do MMMM YYYY'),
        end: endOfTaxYear.format('Do MMMM YYYY')
    };
};

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
};

const calculateTaxYearAndMonth = (date) => {
    // If no date is provided, return null values for tax year and tax month
    if (!date) return { taxYear: null, taxMonth: null };

    // Convert the provided date into a UTC moment object for consistent timezone handling
    const remittanceMoment = moment.utc(date);

    // Extract the year from the date
    const year = remittanceMoment.year();

    // Define the start of the tax year as April 6th of the given year
    const startOfTaxYear = moment.utc(`${year}-04-06T00:00:00Z`);

    // Determine the tax year:
    // If the date is before the start of the tax year (April 6th), 
    // the tax year is the previous year (e.g., 2023).
    // Otherwise, it is the current year (e.g., 2024).
    const taxYear = remittanceMoment.isBefore(startOfTaxYear) ? year - 1 : year;

    // Calculate the start of the current tax year based on whether the date is before April 6th or not
    const startOfCurrentTaxYear = remittanceMoment.isBefore(startOfTaxYear) ? moment.utc(`${year - 1}-04-06T00:00:00Z`) : startOfTaxYear;

    // Determine the tax month by calculating the difference in months between the provided date and the start of the current tax year, plus one
    const taxMonth = remittanceMoment.diff(startOfCurrentTaxYear, 'months') + 1;

    // Return the calculated tax year (as a single year) and tax month
    return { taxYear, taxMonth };
};

const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32); // Use a secure key derivation function
const IV_LENGTH = 16; // AES block size is 16 bytes

// Function to encrypt text (TOTP secret)
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH); // Generate a random 16-byte IV
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64'); // Encode the encrypted data as Base64
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted; // Combine IV (Base64) and encrypted text (Base64)
}

// Function to decrypt text (TOTP secret)
function decrypt(encryptedText) {
    const [ivBase64, encrypted] = encryptedText.split(':'); // Split IV and encrypted text
    const iv = Buffer.from(ivBase64, 'base64'); // Decode the IV from Base64
    if (iv.length !== IV_LENGTH) {
        throw new Error('Invalid initialization vector'); // Ensure the IV is exactly 16 bytes
    }
    const encryptedBuffer = Buffer.from(encrypted, 'base64'); // Decode the encrypted text from Base64
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedBuffer, 'base64', 'utf8'); // Decode during decryption
    decrypted += decipher.final('utf8');
    return decrypted;
}

const getStartOfWeek = (date) => {
    return moment(date).startOf('isoWeek'); // isoWeek starts on Monday
};

/**
 * Fetch attendance records for a given week.
 * @param {Date} startDate - Start date of the week.
 * @param {Date} endDate - End date of the week.
 * @returns {Promise<Array>} - Array of attendance records.
 */
async function getAttendanceForWeek(startDate, endDate) {
  try {
    // Query attendance records between startDate and endDate
    const attendanceRecords = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()] // Use the `Op.between` operator to get records within the date range
        }
      },
      include: [
        { model: Employee},
        { model: Subcontractor},
        { model: Location}
      ],
      order: [['date', 'ASC'], ['Employee', 'name', 'ASC']]
    });

    return attendanceRecords;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw new Error('Failed to fetch attendance records for the week');
  }
}

/**
 * Group attendance records by person.
 * @param {Array} attendanceRecords - Array of attendance records.
 * @returns {Object} - Grouped attendance records by person name.
 */
function groupAttendanceByPerson(attendanceRecords) {
  const grouped = {};

  attendanceRecords.forEach((record) => {
    // Determine the person's name: either an Employee's name or a Subcontractor's company name
    const personName = record.Employee ? record.Employee.name : record.Subcontractor.company;

    // If person is not already in the grouped object, initialize with an empty object
    if (!grouped[personName]) {
      grouped[personName] = {};
    }

    // Store the record in the grouped object, keyed by date (formatted as 'YYYY-MM-DD')
    const formattedDate = moment(record.date).format('YYYY-MM-DD');
    grouped[personName][formattedDate] = {
      holidays_taken: record.holidays_taken || 0,
      days_without_work: record.days_without_work || 0,
      location: record.Location ? `${record.Location.address}, ${record.Location.city}, ${record.Location.postalCode}` : 'Office'
    };
  });

  return grouped;
}

module.exports = {
    slimDateTime,
    formatCurrency,
    validateInvoiceData,
    calculateInvoiceAmounts,
    rounding,
    getCurrentTaxYear,
    getTaxYearStartEnd,
    getCurrentMonthlyReturn,
    getStartOfWeek,
    ensureAuthenticated,
    ensurePermission,
    ensureRole,
    calculateTaxYearAndMonth,
    decrypt,
    encrypt,
    getAttendanceForWeek,
    groupAttendanceByPerson,
};
