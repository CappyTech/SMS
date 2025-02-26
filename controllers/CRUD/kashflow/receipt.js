const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const path = require('path');
const db = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');

const readReceipt = async (req, res, next) => {
    try {
        // Fetch Receipt with its associated supplier
        const Receipt = await db.KF_Receipts.findByPk(req.params.uuid, {
            include: [{ model: db.KF_Suppliers, as: 'supplier' }],
        });
        logger.info('Receipt Data: ' + JSON.stringify(Receipt, null, 2));
        
        if (!Receipt) {
            req.flash('error', 'Receipt not found.');
            return res.redirect('/dashboard/KFreceipt');
        }

        // Parse Lines and Payments from JSON to Object (if not already) and log them for debugging purposes
        Receipt.Lines = typeof Receipt.Lines === 'string' ? JSON.parse(Receipt.Lines) : Receipt.Lines || [];
        Receipt.Payments = typeof Receipt.Payments === 'string' ? JSON.parse(Receipt.Payments) : Receipt.Payments || [];
        logger.info('Parsed Receipt Lines: ' + JSON.stringify(Receipt.Lines, null, 2));
        logger.info('Parsed Payment Lines: ' + JSON.stringify(Receipt.Payments, null, 2));
        
        // Define Charge Types for Line Items (Materials, Labour, CIS Deductions) as per KashFlow API Documentation
        const ChargeTypes = {
            18685896: 'Materials',
            18685897: 'Labour',
            18685964: 'CIS Deductions'
        };

        // Group Line Items by Charge Type for easier rendering in the view
        Object.keys(ChargeTypes).forEach(type => {
            Receipt[ChargeTypes[type]] = Receipt.Lines.filter(line => line.ChargeType === parseInt(type));
        });

        logger.info('Grouped Line Items by Charge Type: ' + JSON.stringify(Receipt, null, 2));


        // Log SupplierID (formerly CustomerID in the context of receipts) for debugging purposes
        logger.info('SupplierID from Receipt: ' + Receipt.CustomerID);

        // Fetch Projects for Line Items (if any) using the Project IDs from the Line Items (if any) and log them for debugging purposes
        const projectIds = Receipt.Lines.map(line => line.ProjID).filter(id => id);
        logger.info('Project IDs: ' + JSON.stringify(projectIds, null, 2));

        const Projects = await db.KF_Projects.findAll({
            where: { ID: projectIds },
        });
        logger.info('Fetched Projects: ' + JSON.stringify(Projects, null, 2));

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

router.post('/receipt/:uuid/submit', authService.ensureAuthenticated, authService.ensureRole('admin'), async (req, res) => {
    try {
        const receipt = await db.KF_Receipts.findOne({ where: { uuid: req.params.uuid } });

        if (!receipt) {
            return res.status(404).send('Receipt not found');
        }

        // Update SubmissionDate to today's date
        const today = moment().format('YYYY-MM-DD');
        await receipt.update({ SubmissionDate: today });

        res.redirect(`/kf/receipt/read/${receipt.uuid}`);
    } catch (error) {
        console.error('Error updating submission date:', error);
        res.status(500).send('Internal server error');
    }
});

router.post('/receipt/:uuid/cancel', authService.ensureAuthenticated, authService.ensureRole('admin'), async (req, res) => {
    try {
        const receipt = await db.KF_Receipts.findOne({ where: { uuid: req.params.uuid } });

        if (!receipt) {
            return res.status(404).send('Receipt not found');
        }

        await receipt.update({ SubmissionDate: null });

        res.redirect(`/kf/receipt/read/${receipt.uuid}`);
    } catch (error) {
        console.error('Error updating submission date:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;