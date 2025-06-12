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
// Asynchronously normalizes various KashFlow payment formats into a consistent array format
async function normalizePayments(paymentsInput, invoiceNumber = 'unknown', customerID = 'unknown') {
    // Initialize the result array that will store the normalized payment records
    let parsedPayments = [];

    // Determine whether the associated entity is a customer or supplier, based on the ID
    const parentType = await identifyParentType(customerID);

    // Determine the document type label (used in logging)
    let docType;
    if (parentType === 'customer') docType = 'Invoice';      // For customers, it's an invoice
    else if (parentType === 'supplier') docType = 'Receipt'; // For suppliers, it's a receipt
    else docType = 'Unknown';                                // Default fallback if identification fails

    try {
        // If the input is a string, try parsing it as JSON first
        if (typeof paymentsInput === 'string') {
            const parsed = JSON.parse(paymentsInput); // Parse the JSON string into a JS object

            // Handle the deeply nested format: { Payment: { Payment: [ ... ] } }
            if (Array.isArray(parsed?.Payment?.Payment)) {
                parsedPayments = parsed.Payment.Payment;

            // Handle the moderately nested format: { Payment: [ ... ] }
            } else if (Array.isArray(parsed?.Payment)) {
                parsedPayments = parsed.Payment;

            // Log a warning if the format is not recognized
            } else {
                logger.warn(`[${parentType}] Unexpected Payments format for ${docType} ${invoiceNumber} (ID: ${customerID}): ${JSON.stringify(parsed)}`);
            }

        // Handle already-parsed input with deep nesting: { Payment: { Payment: [ ... ] } }
        } else if (Array.isArray(paymentsInput?.Payment?.Payment)) {
            parsedPayments = paymentsInput.Payment.Payment;

        // Handle already-parsed input with moderate nesting: { Payment: [ ... ] }
        } else if (Array.isArray(paymentsInput?.Payment)) {
            parsedPayments = paymentsInput.Payment;

        // Handle flat array input: [ ... ]
        } else if (Array.isArray(paymentsInput)) {
            parsedPayments = paymentsInput;

        // Log a warning if none of the expected formats match
        } else {
            logger.warn(`[${parentType}] Unexpected Payments structure for ${docType} ${invoiceNumber} (ID: ${customerID}): ${JSON.stringify(paymentsInput)}`);
        }
    } catch (err) {
        // Log any errors that occur during JSON parsing or normalization
        logger.warn(`[${parentType}] Failed to parse Payments for ${docType} ${invoiceNumber} (ID: ${customerID}): ${err.message}`);
    }

    // Return the normalized array of payment objects (or an empty array if none were found)
    return parsedPayments;
}



module.exports = {
    normalizeLines,
    normalizePayments,
    initializeParentTypeMaps,
    identifyParentType
};
