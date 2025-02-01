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
        logger.error('Error reading kashflow Supplier:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

router.get('/supplier/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readSupplier);

module.exports = router;