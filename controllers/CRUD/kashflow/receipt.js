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

        // Parse Lines
        Receipt.Lines = typeof Receipt.Lines === 'string' ? JSON.parse(Receipt.Lines) : Receipt.Lines || [];
        logger.info('Parsed Receipt Lines: ' + JSON.stringify(Receipt.Lines, null, 2));

        // Log SupplierID (formerly CustomerID in the context of receipts)
        logger.info('SupplierID from Receipt: ' + Receipt.CustomerID);

        // Fetch Projects for Line Items
        const projectIds = Receipt.Lines.map(line => line.ProjID).filter(id => id);
        logger.info('Project IDs: ' + JSON.stringify(projectIds, null, 2));

        const Projects = await db.KF_Projects.findAll({
            where: { ID: projectIds },
        });
        logger.info('Fetched Projects: ' + JSON.stringify(Projects, null, 2));

        // Render the View
        res.render(path.join('kashflow', 'viewReceipt'), {
            title: 'Receipt Overview',
            Receipt: { ...Receipt.toJSON() },
            Supplier: Receipt.supplier, // Use the associated supplier
            Projects,
        });
    } catch (error) {
        logger.error('Error reading KashFlow Receipt: ' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
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

module.exports = router;