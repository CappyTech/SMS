const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const path = require('path');
const db = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');

const readSupplier = async (req, res, next) => {
    try {
        const supplier = await db.KF_Suppliers.findByPk(req.params.uuid);

        if (!supplier) {
            req.flash('error', 'Supplier not found.');
            return res.redirect('/dashboard/KFsupplier');
        }

        const receipts = await db.KF_Receipts.findAll({
            where: {
                CustomerID: supplier.SupplierID
            }
        });

        res.render(path.join('kashflow', 'viewSupplier'), {
            title: 'Supplier Overview',
            supplier,
            receipts,
        });
    } catch (error) {
        logger.error('Error reading kashflow Supplier: ' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

const renderchangeSupplierForm = async (req, res, next) => {
    try {
        const supplier = await db.KF_Suppliers.findByPk(req.params.uuid);

        if (!supplier) {
            req.flash('error', 'Supplier not found.');
            return res.redirect('/dashboard/KFsupplier');
        }

        res.render(path.join('kashflow', 'updateSupplier'), {
            title: 'Change Supplier',
            supplier,
        });
    } catch (error) {
        logger.error('Error rendering kashflow Supplier: ' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

const changeSupplier = async (req, res, next) => {
    try {
        const { subcontractor, cisRate, cisNumber } = req.body;
        await Supplier.update(
            {
                Subcontractor: subcontractor ? true : false, // Ensure boolean value
                CISRate: parseFloat(cisRate), // Convert to float
                CISNumber: cisNumber || null // Ensure empty string becomes null
            },
            { where: { uuid: req.params.uuid } }
        );
        logger.info('Supplier updated to false successfully.');
        return res.redirect('/dashboard/KFsupplier');


    } catch (error) {
        logger.error('Error updating kashflow Supplier: ' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

router.get('/supplier/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readSupplier);
router.get('/supplier/change/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), renderchangeSupplierForm);
router.post('/supplier/change/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), changeSupplier);
module.exports = router;