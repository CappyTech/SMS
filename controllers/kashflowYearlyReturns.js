const express = require('express');
const router = express.Router();
const logger = require('../services/loggerService'); 
const path = require('path');
const kf = require('../services/kashflowDatabaseService');
const authService = require('../services/authService');
const slimDateTime = require('../services/dateService').slimDateTime;

const renderKFYearlyReturns = async (req, res, next) => {
    try {
        const { year, uuid } = req.params;

        if (!year || !uuid) {
            logger.warn("Year and Subcontractor UUID are required.");
            return res.status(400).send("Year and Subcontractor UUID are required.");
        }

        // Extract page break months from query
        const pageBreakMonths = req.query.page
            ? req.query.page.split(',').map(Number)
            : [];

        // Fetch the supplier using UUID
        const supplier = await kf.KF_Suppliers.findOne({ where: { uuid } });
        if (!supplier) {
            logger.warn(`Supplier with UUID ${uuid} not found.`);
            return res.status(404).send("Supplier not found.");
        }

        // Fetch receipts for the given year
        const receipts = await kf.KF_Receipts.findAll({
            where: { CustomerID: supplier.SupplierID, TaxYear: year },
            order: [['InvoiceNumber', 'ASC']]
        });

        // Process receipts to extract details
        const receiptsByMonth = {};
        receipts.forEach(receipt => {
            const month = receipt.TaxMonth || moment.utc(receipt.InvoiceDate).month() + 1; // Ensure TaxMonth is used

            // Ensure the month key exists
            if (!receiptsByMonth[month]) {
                receiptsByMonth[month] = [];
            }

            // Parse Lines
            let parsedLines = [];
            try {
                if (typeof receipt.Lines === 'string') {
                    const linesParsed = JSON.parse(receipt.Lines);
                    if (Array.isArray(linesParsed)) {
                        parsedLines = linesParsed;
                    } else if (Array.isArray(linesParsed.anyType)) {
                        parsedLines = linesParsed.anyType;
                    } else {
                        logger.warn(`Unexpected parsedLines object structure for invoice ${receipt.InvoiceNumber}: ${JSON.stringify(receipt.Lines)}`);
                    }
                } else if (Array.isArray(receipt.Lines)) {
                    parsedLines = receipt.Lines;
                } else if (Array.isArray(receipt.Lines?.anyType)) {
                    parsedLines = receipt.Lines.anyType;
                } else {
                    logger.warn(`Unexpected parsedLines format for invoice ${receipt.InvoiceNumber}: ${JSON.stringify(receipt.Lines)}`);
                }
            } catch (e) {
                logger.warn(`Failed to parse receipt lines for invoice ${receipt.InvoiceNumber}: ${e.message}`);
                parsedLines = [];
            }

            // Parse Payments
            let parsedPayments = { Payment: { Payment: [] } };
            try {
                if (typeof receipt.Payments === 'string') {
                    const paymentsParsed = JSON.parse(receipt.Payments);
                    if (Array.isArray(paymentsParsed?.Payment?.Payment)) {
                        parsedPayments = paymentsParsed;
                    } else {
                        logger.warn(`Unexpected parsedPayments format for invoice ${receipt.InvoiceNumber}: ${JSON.stringify(receipt.Payments)}`);
                    }
                } else if (Array.isArray(receipt.Payments?.Payment?.Payment)) {
                    parsedPayments = receipt.Payments;
                } else {
                    logger.warn(`Unexpected non-string parsedPayments structure for invoice ${receipt.InvoiceNumber}`);
                }
            } catch (e) {
                logger.warn(`Failed to parse payments for invoice ${receipt.InvoiceNumber}: ${e.message}`);
                parsedPayments = { Payment: { Payment: [] } };
            }

            // Extract values from Lines
            const labourCost = parsedLines.filter(line => line.ChargeType === 18685897).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0);
            const materialCost = parsedLines.filter(line => line.ChargeType === 18685896).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0);
            const cisAmount = Math.abs( parsedLines.filter(line => line.ChargeType === 18685964).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0) );
            const grossAmount = labourCost + materialCost;
            const netAmount = grossAmount - cisAmount;

            // Extract first PayDate if available
            const payDates = parsedPayments?.Payment?.Payment?.map(p => p.PayDate) || [];
            const payDate = payDates.length > 0 ? slimDateTime(payDates[0]) : 'N/A';

            // Add to receiptsByMonth
            receiptsByMonth[month].push({
                InvoiceNumber: receipt.CustomerReference,
                KashflowNumber: receipt.InvoiceNumber,
                InvoiceDate: receipt.InvoiceDate,
                PayDates: payDates,
                PayDate: payDate,
                GrossAmount: grossAmount,
                LabourCost: labourCost,
                MaterialCost: materialCost,
                CISAmount: cisAmount,
                NetAmount: netAmount,
                SubmissionDate: receipt.SubmissionDate
            });
        });

        res.render(path.join('kashflow', 'yearlyReturns'), {
            title: 'Subcontractor Yearly Returns',
            year,
            supplier,
            receiptsByMonth,
            monthNames: [
                'April', 'May', 'June', 'July', 'August', 'September',
                'October', 'November', 'December', 'January', 'February', 'March'
            ],
            pageBreakMonths
        });
    } catch (error) {
        logger.error(`Error rendering monthly returns for one subcontractor: ${error.message}`, { stack: error.stack });
        next(error);
    }
};

router.get('/returns/:year/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFYearlyReturns);

module.exports = router;
