const moment = require('moment');
const logger = require('./logger');

function slimDateTime(dateString, includeTime = false) {
    const date = moment.utc(dateString);
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
}

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
const ensureRole = (role) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.flash('error', 'You need to sign in.');
            return res.redirect('/signin');
        }
        if (req.session.user.role !== role) {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        next();
    };
};

// Middleware to handle permission-based access
const ensurePermission = (permissions) => {
    return (req, res, next) => {
        if (!req.session.user) {
            req.flash('error', 'You need to sign in.');
            return res.redirect('/signin');
        }
        const userPermissions = req.session.user;
        const hasPermission = permissions.some(permission => userPermissions[permission]);
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
}

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
}

function rounding(number, up) {
    return up ? Math.ceil(number) : Math.floor(number);
}

function getCurrentTaxYear() {
    const today = moment.utc();
    const startOfTaxYear = moment.utc({ month: 3, day: 6 }); // April 6th
    if (today.isBefore(startOfTaxYear)) {
        return startOfTaxYear.subtract(1, 'years').year();
    }
    return startOfTaxYear.year();
}

function getTaxYearStartEnd(year) {
    const startOfTaxYear = moment.utc({ year, month: 3, day: 6 }); // 6th April of the specified year
    const endOfTaxYear = moment.utc(startOfTaxYear).add(1, 'years').subtract(1, 'days'); // 5th April of the next year
    return {
        start: startOfTaxYear.format('Do MMMM YYYY'),
        end: endOfTaxYear.format('Do MMMM YYYY')
    };
}

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
};
