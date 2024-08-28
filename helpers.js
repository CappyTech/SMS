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
        req.flash('error', 'You need to sign in.');
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
            req.flash('error', 'You need to sign in.');
            return res.redirect('/signin');
        }
        // Check if user's role is in the list of allowed roles
        if (!roles.includes(req.session.user.role)) {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        next();
    };
};

// Middleware to handle permission-based access
const ensurePermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.flash('error', 'You need to sign in.');
            return res.redirect('/signin');
        }

        // Check if user has at least one of the required permissions
        const userPermissions = req.session.user;
        const hasPermission = requiredPermissions.every(permission => userPermissions[permission]);

        if (!hasPermission) {
            req.flash('error', 'Access denied.');
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
        //month: value => !isNaN(value) && Number(value) >= 1 && Number(value) <= 12,
        //year: value => !isNaN(value) && Number(value) >= 2000
    };

    Object.keys(validations).forEach(field => {
        if (!validations[field](data[field])) {
            errors.push(`Invalid or missing value for ${field}`);
        }
    });

    if (data.submissionDate === '0000-00-00 00:00:00' || !data.submissionDate) {
        data.submissionDate = null;
    }

    if (errors.length > 0) {
        const errorMessage = errors.join(', ');
        logger.error(`Validation errors: ${errorMessage}`);
        throw new Error(errorMessage);
    }

    return data;
};

function calculateInvoiceAmounts(labourCost, materialCost, deduction, cisNumber) {
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
    const netAmount = grossAmount - cisAmount;
    reverseCharge = grossAmount * 0.2;

    return {
        cisRate,
        grossAmount: grossAmount.toFixed(2),
        cisAmount: cisAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        reverseCharge: reverseCharge.toFixed(2)
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

const axios = require('axios');
const qs = require('querystring');

async function getAccessToken() {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = {
        client_id: clientId,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: clientSecret,
        grant_type: 'client_credentials',
    };

    try {
        const response = await axios.post(tokenUrl, qs.stringify(params), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = response.data.access_token;
        logger.info('Access token obtained');
        return accessToken;
    } catch (error) {
        logger.error('Error fetching access token: ' + error);
        throw new Error('Access token not obtained');
    }
}

async function fetchOneDriveFiles() {
    try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
            logger.error('Access token not obtained');
            throw new Error('Access token not obtained'); // Rethrow to ensure the failure propagates.
        }

        const oneDriveUrl = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
        const response = await axios.get(oneDriveUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        });

        const files = response.data.value;
        logger.info('Fetched files:', files);
        return files;
    } catch (error) {
        logger.error('Error fetching OneDrive files: ' + error.message);
        throw new Error('Failed to fetch OneDrive files');  // Rethrow for better control upstream
    }
}


const Drive = require('./models/drive');  // Assuming you have a Sequelize model for storing files

async function saveFilesToDatabase(files) {
    for (const file of files) {
        try {
            const existingFile = await Drive.findOne({ where: { itemId: file.id } });

            if (existingFile) {
                // Update the existing file
                await existingFile.update({
                    name: file.name,
                    size: file.size,
                    mimeType: file.file ? file.file.mimeType : null,
                    fileType: file.file ? file.file.fileType : null,
                    createdDateTime: file.createdDateTime,
                    lastModifiedDateTime: file.lastModifiedDateTime,
                    parentPath: file.parentReference ? file.parentReference.path : null,
                    downloadUrl: file['@microsoft.graph.downloadUrl'] || null,
                });
                logger.info(`Updated file: ${file.name}`);
            } else {
                // Create a new file record
                await Drive.create({
                    itemId: file.id,
                    name: file.name,
                    size: file.size,
                    mimeType: file.file ? file.file.mimeType : null,
                    fileType: file.file ? file.file.fileType : null,
                    createdDateTime: file.createdDateTime,
                    lastModifiedDateTime: file.lastModifiedDateTime,
                    parentPath: file.parentReference ? file.parentReference.path : null,
                    downloadUrl: file['@microsoft.graph.downloadUrl'] || null,
                });
                logger.info(`Created file: ${file.name}`);
            }
        } catch (error) {
            logger.error('Error saving or updating file to the database:' + error);
        }
    }
}

async function syncOneDriveToDatabase() {
    try {
        const files = await fetchOneDriveFiles();
        if (files && files.length > 0) {
            await saveFilesToDatabase(files);
        }
    } catch (error) {
        logger.error('Error syncing OneDrive to database: ' + error.message);
    }
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
    ensureAuthenticated,
    ensurePermission,
    ensureRole,
    calculateTaxYearAndMonth,
    decrypt,
    encrypt,
    syncOneDriveToDatabase,
};
