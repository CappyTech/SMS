const logger = require('./loggerService');
const db = require('./kashflowDatabaseService');

// Internal maps for fast lookups
let customerMap = new Map();
let supplierMap = new Map();

async function initializeParentTypeMaps() {
    const [customers, suppliers] = await Promise.all([
        db.KF_Customers.findAll({ attributes: ['CustomerID'] }),
        db.KF_Suppliers.findAll({ attributes: ['SupplierID'] })
    ]);

    customerMap = new Map(customers.map(c => [String(c.CustomerID), true]));
    supplierMap = new Map(suppliers.map(s => [String(s.SupplierID), true]));

    logger.info(`Loaded ${customerMap.size} customers and ${supplierMap.size} suppliers into memory.`);
}

function identifyParentTypeOnce(customerID) {
    const id = String(customerID);
    if (customerMap.has(id)) return 'customer';
    if (supplierMap.has(id)) return 'supplier';
    return 'unknown';
}

async function identifyParentType(customerID) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        const result = identifyParentTypeOnce(customerID);
        if (result !== 'unknown') return result;

        logger.warn(`Parent type for CustomerID ${customerID} is unknown (attempt ${attempt}), refreshing maps...`);
        try {
            await initializeParentTypeMaps();
        } catch (err) {
            logger.error(`Failed to refresh parent type maps on attempt ${attempt}: ${err.message}`);
            break;
        }
    }

    logger.error(`Failed to identify parent type for CustomerID ${customerID} after 3 attempts.`);
    return 'unknown';
}

/**
 * Normalize lines from various possible formats.
 */
async function normalizeLines(linesInput, invoiceNumber = 'unknown', customerID = 'unknown') {
    let parsedLines = [];
    const parentType = await identifyParentType(customerID);

    let docType;
    if (parentType === 'customer') docType = 'Invoice';
    else if (parentType === 'supplier') docType = 'Receipt';
    else docType = 'Unknown';

    try {
        if (typeof linesInput === 'string') {
            const parsed = JSON.parse(linesInput);
            parsedLines = Array.isArray(parsed) ? parsed : Array.isArray(parsed.anyType) ? parsed.anyType : [];
        } else if (Array.isArray(linesInput)) {
            parsedLines = linesInput;
        } else if (Array.isArray(linesInput?.anyType)) {
            parsedLines = linesInput.anyType;
        } else {
            logger.warn(`[${parentType}] Unexpected Lines format for ${docType} ${invoiceNumber} (ID: ${customerID}): ${JSON.stringify(linesInput)}`);
        }
    } catch (err) {
        logger.warn(`[${parentType}] Failed to parse Lines for ${docType} ${invoiceNumber} (ID: ${customerID}): ${err.message}`);
    }

    return Array.isArray(parsedLines) ? parsedLines : [];
}

/**
 * Normalize payment records from various possible formats.
 */
async function normalizePayments(paymentsInput, invoiceNumber = 'unknown', customerID = 'unknown') {
    let parsedPayments = { Payment: { Payment: [] } };
    const parentType = await identifyParentType(customerID);

    let docType;
    if (parentType === 'customer') docType = 'Invoice';
    else if (parentType === 'supplier') docType = 'Receipt';
    else docType = 'Unknown';

    try {
        if (typeof paymentsInput === 'string') {
            const parsed = JSON.parse(paymentsInput);

            if (Array.isArray(parsed?.Payment?.Payment)) {
                parsedPayments = parsed;
            } else if (Array.isArray(parsed?.Payment)) {
                parsedPayments = { Payment: { Payment: parsed.Payment } };
            } else {
                logger.warn(`[${parentType}] Unexpected Payments format for ${docType} ${invoiceNumber} (ID: ${customerID}): ${JSON.stringify(paymentsInput)}`);
            }
        } else if (Array.isArray(paymentsInput?.Payment?.Payment)) {
            parsedPayments = paymentsInput;
        } else if (Array.isArray(paymentsInput?.Payment)) {
            parsedPayments = { Payment: { Payment: paymentsInput.Payment } };
        } else {
            logger.warn(`[${parentType}] Unexpected Payments structure for ${docType} ${invoiceNumber} (ID: ${customerID})`);
        }
    } catch (err) {
        logger.warn(`[${parentType}] Failed to parse Payments for ${docType} ${invoiceNumber} (ID: ${customerID}): ${err.message}`);
    }

    return parsedPayments || { Payment: { Payment: [] } };
}


module.exports = {
    normalizeLines,
    normalizePayments,
    initializeParentTypeMaps,
    identifyParentType
};
