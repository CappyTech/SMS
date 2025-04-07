const logger = require('./loggerService');

function normalizeLines(linesInput, invoiceNumber = 'unknown') {
    let parsedLines = [];

    try {
        if (typeof linesInput === 'string') {
            const parsed = JSON.parse(linesInput);
            parsedLines = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed.anyType)
                    ? parsed.anyType
                    : [];
        } else if (Array.isArray(linesInput)) {
            parsedLines = linesInput;
        } else if (Array.isArray(linesInput?.anyType)) {
            parsedLines = linesInput.anyType;
        } else {
            logger.warn(`Unexpected Lines format for invoice ${invoiceNumber}: ${JSON.stringify(linesInput)}`);
        }
    } catch (err) {
        logger.warn(`Failed to parse Lines for invoice ${invoiceNumber}: ${err.message}`);
    }

    return parsedLines;
}

function normalizePayments(paymentsInput, invoiceNumber = 'unknown') {
    let parsedPayments = { Payment: { Payment: [] } };

    try {
        if (typeof paymentsInput === 'string') {
            const parsed = JSON.parse(paymentsInput);

            if (Array.isArray(parsed?.Payment?.Payment)) {
                parsedPayments = parsed;
            } else if (Array.isArray(parsed?.Payment)) {
                parsedPayments = { Payment: { Payment: parsed.Payment } };
            } else {
                logger.warn(`Unexpected Payments format for invoice ${invoiceNumber}: ${JSON.stringify(paymentsInput)}`);
            }
        } else if (Array.isArray(paymentsInput?.Payment?.Payment)) {
            parsedPayments = paymentsInput;
        } else if (Array.isArray(paymentsInput?.Payment)) {
            parsedPayments = { Payment: { Payment: paymentsInput.Payment } };
        } else {
            logger.warn(`Unexpected Payments structure for invoice ${invoiceNumber}`);
        }
    } catch (err) {
        logger.warn(`Failed to parse Payments for invoice ${invoiceNumber}: ${err.message}`);
    }

    return parsedPayments;
}

module.exports = {
    normalizeLines,
    normalizePayments
};
