const moment = require('moment');

function slimDateTime(dateString, includeTime = false) {
    const date = new Date(dateString);
    const dateOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    const formattedDate = date.toLocaleDateString('en-GB', dateOptions);

    if (includeTime) {
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
        };
        const formattedTime = date.toLocaleTimeString('en-GB', timeOptions);
        return formattedDate.replace(/\//g, '/') + ' ' + formattedTime;
    }

    return formattedDate.replace(/\//g, '/');
}

function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        throw new Error('Invalid input. Amount must be a number.');
    }
    return '£' + amount.toFixed(2);
}

const isAdmin = (req, res, next) => {
    if (req.session.user.role !== 'admin') {
      return res.status(403).send('Access denied.');
    }
    next();
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
        month: value => !isNaN(value) && Number(value) >= 1 && Number(value) <= 12,
        year: value => !isNaN(value) && Number(value) >= 2000
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
        throw new Error(errors.join(', '));
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
    const today = moment();
    const startOfTaxYear = moment({ month: 3, day: 6 }); // April 6th
    if (today.isBefore(startOfTaxYear)) {
        return startOfTaxYear.subtract(1, 'years').year();
    }
    return startOfTaxYear.year();
}

function getTaxYearStartEnd(year) {
    const startOfTaxYear = moment({ year, month: 3, day: 6 }); // 6th April of the specified year
    const endOfTaxYear = moment(startOfTaxYear).add(1, 'years').subtract(1, 'days'); // 5th April of the next year
    return {
        start: startOfTaxYear.format('Do MMMM YYYY'),
        end: endOfTaxYear.format('Do MMMM YYYY')
    };
}

function getCurrentMonthlyReturn(year, month) {
    const today = moment();
    let startOfCurrentPeriod = moment({ year, month, day: 6 }); // 6th of the specified month

    if (today.isBefore(startOfCurrentPeriod)) {
        startOfCurrentPeriod.subtract(1, 'months');
    }

    const endOfCurrentPeriod = moment(startOfCurrentPeriod).add(1, 'months').subtract(1, 'days');
    const submissionDeadline = moment(endOfCurrentPeriod).add(6, 'days'); // 11th of the current month
    const hmrcUpdateDate = moment(endOfCurrentPeriod).add(11, 'days'); // 17th of the current month
    const submissionDeadlineInDays = submissionDeadline.diff(today, 'days');
    const hmrcUpdateDateInDays = hmrcUpdateDate.diff(today, 'days');

    return {
        periodStart: startOfCurrentPeriod.format('YYYY-MM-DD'),
        periodEnd: endOfCurrentPeriod.format('YYYY-MM-DD'),
        periodStartDisplay: startOfCurrentPeriod.format('Do MMMM YYYY'),
        periodEndDisplay: endOfCurrentPeriod.format('Do MMMM YYYY'),
        submissionDeadline: submissionDeadline.format('Do MMMM YYYY'),
        hmrcUpdateDate: hmrcUpdateDate.format('Do MMMM YYYY'),
        submissionDeadlineInDays,
        hmrcUpdateDateInDays
    };
}

module.exports = {
    slimDateTime,
    formatCurrency,
    isAdmin,
    validateInvoiceData,
    calculateInvoiceAmounts,
    rounding,
    getCurrentTaxYear,
    getTaxYearStartEnd,
    getCurrentMonthlyReturn
};
