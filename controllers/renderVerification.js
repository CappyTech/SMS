const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../services/sequelizeDatabaseService');
const logger = require('../services/loggerService');
const authService = require('../services/authService');

const renderSupplierVerification = async (req, res) => {
    try {
        const suppliers = await db.KF_Suppliers.findAll();
        const subcontractors = await db.Subcontractors.findAll();

        res.render(path.join('verification', 'supplier'), {
            title: 'Supplier Verification',
            suppliers,
            subcontractors,
        });
    } catch (error) {
        logger.error('Error rendering supplier verification: ' + error.message);
        req.flash('error', 'Failed to load suppliers.');
        res.redirect('/');
    }
};

const renderReceiptVerification = async (req, res) => {
    try {
        const receipts = await db.KF_Receipts.findAll();
        const invoices = await db.Invoices.findAll();

        res.render(path.join('verification', 'receipt'), {
            title: 'Receipt Verification',
            receipts,
            invoices,
        });
    } catch (error) {
        logger.error('Error rendering receipt verification: ' + error.message);
        req.flash('error', 'Failed to load receipts.');
        res.redirect('/');
    }
};

router.get('/supplier/verification', authService.ensureAuthenticated, authService.ensureRole('admin'), renderSupplierVerification);
router.get('/receipt/verification', authService.ensureAuthenticated, authService.ensureRole('admin'), renderReceiptVerification);

module.exports = router;