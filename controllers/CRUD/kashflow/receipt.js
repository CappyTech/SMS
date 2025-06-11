const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const moment = require('moment');
const path = require('path');
const kf = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');
const kashflowNormalizer = require('../../../services/kashflowNormalizer');

const readReceipt = async (req, res, next) => {
    try {
        // Fetch Receipt with its associated supplier
        const Receipt = await kf.KF_Receipts.findByPk(req.params.uuid, {
            include: [{ model: kf.KF_Suppliers, as: 'supplier' }],
        });
        //logger.info('Receipt Data: ' + JSON.stringify(Receipt, null, 2));
        
        if (!Receipt) {
            req.flash('error', 'Receipt not found.');
            return res.redirect('/dashboard/KFreceipt');
        }

        // Parse Lines and Payments from JSON to Object (if not already) and log them for debugging purposes
        Receipt.Lines = typeof Receipt.Lines === 'string' ? JSON.parse(Receipt.Lines) : Receipt.Lines || [];
        if (Receipt.Lines.anyType) {
            Receipt.Lines = Receipt.Lines.anyType;
          }
        Receipt.Payments = typeof Receipt.Payments === 'string' ? JSON.parse(Receipt.Payments) : Receipt.Payments || [];

        // Normalize with parent type awareness
        const normalizedLines = await kashflowNormalizer.normalizeLines(Receipt.Lines, Receipt.InvoiceNumber, Receipt.CustomerID);
        const normalizedPayments = await kashflowNormalizer.normalizePayments(Receipt.Payments, Receipt.InvoiceNumber, Receipt.CustomerID);
        //logger.info('Parsed Receipt Lines: ' + JSON.stringify(Receipt.Lines, null, 2));
        //logger.info('Parsed Payment Lines: ' + JSON.stringify(Receipt.Payments, null, 2));
        
        /* Define Charge Types for Line Items (Materials, Labour, CIS Deductions) as per KashFlow API Documentation
        const ChargeTypes = {
            18685896: 'Materials',
            18685897: 'Labour',
            18685964: 'CIS Deductions'
        };
        */
        const ChargeTypes = require('./chargeTypes.json');

        // Group Line Items by Charge Type for easier rendering in the view
        Object.keys(ChargeTypes).forEach(type => {
            Receipt[ChargeTypes[type]] = normalizedLines.filter(line => line.ChargeType === parseInt(type));
        });

        //logger.info('Grouped Line Items by Charge Type: ' + JSON.stringify(Receipt, null, 2));


        // Log SupplierID (formerly CustomerID in the context of receipts) for debugging purposes
        //logger.info('SupplierID from Receipt: ' + Receipt.CustomerID);

        // Fetch Projects for Line Items (if any) using the Project IDs from the Line Items (if any) and log them for debugging purposes
        const projectIds = normalizedLines.map(line => line.ProjID).filter(id => id);
        //logger.info('Project IDs: ' + JSON.stringify(projectIds, null, 2));

        const Projects = await kf.KF_Projects.findAll({
            where: { ID: projectIds },
        });
        //logger.info('Fetched Projects: ' + JSON.stringify(Projects, null, 2));

        // Render the View with the Receipt Data and associated Supplier and Projects for Line Items (if any)
        res.render(path.join('kashflow', 'viewReceipt'), {
            title: 'Receipt Overview',
            Receipt: { ...Receipt.toJSON() },
            ChargeTypes,
            Supplier: Receipt.supplier, // Use the associated supplier object instead of the CustomerID for better readability in the view (e.g. Supplier.Name instead of Receipt.CustomerID)
            Projects,
        });
    } catch (error) {
        logger.error('Error reading KashFlow Receipt: ' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler middleware in app.js for logging and debugging purposes (if needed)
    }
};

router.get('/receipt/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readReceipt);

router.post('/receipt/:uuid/change', authService.ensureAuthenticated, authService.ensureRole('admin'), async (req, res) => {
    try {
        const receipt = await kf.KF_Receipts.findOne({ where: { uuid: req.params.uuid } });

        if (!receipt) {
            return res.status(404).send('Receipt not found');
        }

        await receipt.update({ SubmissionDate: req.body.submissionDate });

        res.redirect(`/kashflow/receipt/read/${receipt.uuid}`);
    } catch (error) {
        logger.error('Error updating submission date: '+ error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler middleware in app.js for logging and debugging purposes (if needed)
    }
});

router.post('/receipt/change', authService.ensureAuthenticated, authService.ensureRole('admin'), async (req, res) => {
    try {
        const { submissionDate, uuids, redirectPath  } = req.body;
        const targetUUIDs = uuids?.length ? Array.isArray(uuids) ? uuids : [uuids] : [req.params.uuid];
        const receipt = await kf.KF_Receipts.findAll({ where: { uuid: targetUUIDs } });

        if (!receipt) {
            return res.status(404).send('Receipt not found');
        }

        // Update all matching receipts
        await kf.KF_Receipts.update(
            { SubmissionDate: submissionDate },
            { where: { uuid: targetUUIDs } }
        );

        res.redirect(redirectPath || `/CIS`);
    } catch (error) {
        logger.error('Error updating submission date: '+ error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler middleware in app.js for logging and debugging purposes (if needed)
    }
});

router.post('/receipt/:uuid/submit', authService.ensureAuthenticated, authService.ensureRole('admin'), async (req, res) => {
    try {
        const receipt = await kf.KF_Receipts.findOne({ where: { uuid: req.params.uuid } });

        if (!receipt) {
            return res.status(404).send('Receipt not found');
        }

        // Update SubmissionDate to today's date
        const today = moment().format('YYYY-MM-DD');
        await receipt.update({ SubmissionDate: today });

        res.redirect(`/kashflow/receipt/read/${receipt.uuid}`);
    } catch (error) {
        logger.error('Error updating submission date: '+ error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler middleware in app.js for logging and debugging purposes (if needed)
    }
});

router.post('/receipt/:uuid/cancel', authService.ensureAuthenticated, authService.ensureRole('admin'), async (req, res) => {
    try {
        const receipt = await kf.KF_Receipts.findOne({ where: { uuid: req.params.uuid } });

        if (!receipt) {
            return res.status(404).send('Receipt not found');
        }

        await receipt.update({ SubmissionDate: null });

        res.redirect(`/kashflow/receipt/read/${receipt.uuid}`);
    } catch (error) {
        logger.error('Error updating submission date: '+ error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler middleware in app.js for logging and debugging purposes (if needed)
    }
});

module.exports = router;