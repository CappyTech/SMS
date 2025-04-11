const express = require('express');
const router = express.Router();
const logger = require('../services/loggerService');
const path = require('path');
const kf = require('../services/kashflowDatabaseService');
const authService = require('../services/authService');
const ChargeTypes = require('./CRUD/kashflow/chargeTypes.json');
const { normalizeLines, normalizePayments } = require('../services/kashflowNormalizer');

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
            const month = receipt.TaxMonth || moment.tz(receipt.InvoiceDate, 'Europe/London').month() + 1; // Ensure TaxMonth is used // ensure .tz

            // Ensure the month key exists
            if (!receiptsByMonth[month]) {
                receiptsByMonth[month] = [];
            }

            const normalizedLines = normalizeLines(receipt.Lines, receipt.InvoiceNumber);
            const normalizedPayments = normalizePayments(receipt.Payments, receipt.InvoiceNumber);

            // Extract values from Lines
            const labourCost = normalizedLines.filter(line => line.ChargeType === 18685897).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0);
            const materialCost = normalizedLines.filter(line => line.ChargeType === 18685896).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0);
            const cisAmount = Math.abs(normalizedLines.filter(line => line.ChargeType === 18685964).reduce((sum, line) => sum + (line.Rate * line.Quantity), 0));
            const grossAmount = labourCost + materialCost;
            const netAmount = grossAmount - cisAmount;

            // Extract first PayDate if available
            const payDates = normalizedPayments?.Payment?.Payment?.map(p => p.PayDate) || [];
            const payDate = payDates.length > 0 ? payDates[0] : 'N/A';

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

const puppeteer = require('puppeteer');

// Handle PDF download
router.post('/download-pdf', async (req, res, next) => {
    try {
        const {
            format,
            width,
            height,
            landscape,
            printBackground,
            scale,
            pageRanges,
            preferCSSPageSize,
            displayHeaderFooter,
            headerTemplate,
            footerTemplate,
            marginTop,
            marginBottom,
            marginLeft,
            marginRight,
            year,
            uuid,
            pageBreakMonths,
            filename
        } = req.body;

        if (!year || !uuid) {
            return res.status(400).send("Missing year or UUID for PDF generation.");
        }

        const queryString = pageBreakMonths ? `?page=${pageBreakMonths}` : '';
        const fullUrl = `${req.protocol}://${req.get('host')}/kashflow/yearly/returns/${year}/${uuid}${queryString}`;

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required on some Linux servers
        });
        const page = await browser.newPage();

        const cookies = req.headers.cookie;

        if (cookies) {
            const cookieArray = cookies.split(';').map(cookieStr => {
                const [name, ...val] = cookieStr.trim().split('=');
                return {
                    name,
                    value: val.join('='),
                    domain: 'localhost', // or your production domain
                    path: '/',
                    httpOnly: true,
                    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
                };
            });

            await page.browserContext().setCookie(...cookieArray);

        }

        await page.goto(fullUrl, { waitUntil: 'networkidle0' });



        const options = {
            landscape: !!parseInt(landscape), // "1" = true, "0" = false
            printBackground: printBackground === 'off',
            scale: parseFloat(scale) || 1,
            pageRanges: pageRanges || undefined,
            preferCSSPageSize: preferCSSPageSize === 'off',
            displayHeaderFooter: displayHeaderFooter === 'off',
            headerTemplate: headerTemplate || '',
            footerTemplate: footerTemplate || '',
            margin: {
                top: marginTop || '20mm',
                bottom: marginBottom || '20mm',
                left: marginLeft || '15mm',
                right: marginRight || '15mm'
            }
        };

        // Only add format or custom size if provided
        if (format) {
            options.format = format;
        } else {
            if (width) options.width = width;
            if (height) options.height = height;
        }

        const pdfBuffer = await page.pdf(options);

        await browser.close();

        let safeFilename = filename.replace(/[^\w\-\.]+/g, '_');

        if (!safeFilename.endsWith('.pdf')) {
            safeFilename += '.pdf';
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (error) {
        logger.error('[PDF Generation Error]' + error);
        next(error);
    }
});

router.get('/returns/:year/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), renderKFYearlyReturns);

module.exports = router;
