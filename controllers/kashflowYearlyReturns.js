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

            // Parse Lines and Payments
            const parsedLines = typeof receipt.Lines === 'string' ? JSON.parse(receipt.Lines) : receipt.Lines || [];
            const parsedPayments = typeof receipt.Payments === 'string' ? JSON.parse(receipt.Payments) : receipt.Payments || { Payment: { Payment: [] } };

            // Extract values from Lines
            const labourCost = parsedLines.filter(line => line.ChargeType === 18685897).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0);
            const materialCost = parsedLines.filter(line => line.ChargeType === 18685896).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0);
            const cisAmount = parsedLines.filter(line => line.ChargeType === 18685964).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0);
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
            title: 'Subcontractor Monthly Returns',
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
