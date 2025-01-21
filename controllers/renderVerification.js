const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../services/sequelizeDatabaseService');
const kf = require('../services/kashflowDatabaseService');
const logger = require('../services/loggerService');
const authService = require('../services/authService');

const renderSupplierVerification = async (req, res, next) => {
    try {
        const suppliers = await kf.KF_Suppliers.findAll();
        const subcontractors = await db.Subcontractors.findAll();

        res.render(path.join('verification', 'supplier'), {
            title: 'Supplier Verification',
            suppliers,
            subcontractors,
        });
    } catch (error) {
        logger.error('Error rendering supplier verification: ' + error.message);
        req.flash('error', 'Failed to load suppliers.');
        next(error); // Pass the error to the error handler
    }
};

const renderReceiptVerification = async (req, res, next) => {
    try {
        const receipts = await kf.KF_Receipts.findAll();
        const invoices = await db.Invoices.findAll();

        res.render(path.join('verification', 'receipt'), {
            title: 'Receipt Verification',
            receipts,
            invoices,
        });
    } catch (error) {
        logger.error('Error rendering receipt verification: ' + error.message);
        req.flash('error', 'Failed to load receipts.');
        next(error); // Pass the error to the error handler
    }
};

router.get('/supplier/', authService.ensureAuthenticated, authService.ensureRole('admin'), renderSupplierVerification);
router.get('/receipt/', authService.ensureAuthenticated, authService.ensureRole('admin'), renderReceiptVerification);

module.exports = router;