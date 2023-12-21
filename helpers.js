// helpers.js

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
    // Check if the amount is a number
    if (typeof amount !== 'number') {
        throw new Error('Invalid input. Amount must be a number.');
    }

    // Format the amount with two decimal places and add £ symbol
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

    // Define required fields and their validation rules
    const validations = {
        invoiceNumber: value => value && value.trim() !== '',
        kashflowNumber: value => value && value.trim() !== '',
        invoiceDate: value => value && !isNaN(Date.parse(value)),
        remittanceDate: value => !value || !isNaN(Date.parse(value)),
        labourCost: value => !isNaN(value) && Number(value) >= 0,
        materialCost: value => !isNaN(value) && Number(value) >= 0,
        month: value => !isNaN(value) && Number(value) >= 1 && Number(value) <= 12,
        year: value => !isNaN(value) && Number(value) >= 2000 // Assuming year 2000 as the earliest acceptable year
    };

    // Perform the validations
    Object.keys(validations).forEach(field => {
        if (!validations[field](data[field])) {
            errors.push(`Invalid or missing value for ${field}`);
        }
    });

    // Special handling for submissionDate
    if (data.submissionDate === '0000-00-00 00:00:00' || !data.submissionDate) {
        data.submissionDate = null;
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    return data; // Return the validated data
}


function calculateInvoiceAmounts(labourCost, materialCost, isGross, cisNumber, vatNumber) {
    labourCost = parseFloat(labourCost);
    materialCost = parseFloat(materialCost);

    const grossAmount = labourCost + materialCost;
    let cisRate, reverseCharge;

    // Determine the CIS rate based on the subcontractor's status
    if (isGross) {
        cisRate = 0.0; // 0% for gross subcontractors
    } else if (cisNumber) {
        cisRate = 0.2; // 20% for subcontractors with a CIS number
    } else {
        cisRate = 0.3; // 30% if CIS number is null
    }

    const cisAmount = labourCost * cisRate;
    const netAmount = grossAmount - cisAmount;

    // Calculate Reverse Charge only if VAT number is present
    reverseCharge = vatNumber ? grossAmount * 0.2 : 0; // 20% Reverse Charge

    return {
        grossAmount: grossAmount.toFixed(2),
        cisAmount: cisAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        reverseCharge: reverseCharge.toFixed(2)
    };
}


module.exports = {
    slimDateTime,
    formatCurrency,
    isAdmin,
    validateInvoiceData,
    calculateInvoiceAmounts
};