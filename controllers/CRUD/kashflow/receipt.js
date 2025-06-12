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

        const ChargeTypes = require('./chargeTypes.json');

        // Group Line Items by Charge Type for easier rendering in the view
        Object.keys(ChargeTypes).forEach(type => {
            Receipt[ChargeTypes[type]] = Receipt.Lines.filter(line => line.ChargeType === parseInt(type));
        });

        const projectIds = Receipt.Lines.map(line => line.ProjID).filter(id => id);

        const Projects = await kf.KF_Projects.findAll({
            where: { ID: projectIds },
        });

        res.render(path.join('kashflow', 'viewReceipt'), {
            title: 'Receipt Overview',
            Receipt: Receipt,
            ChargeTypes,
            Supplier: Receipt.supplier,
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