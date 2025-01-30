const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const path = require('path');
const db = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');

const readSupplier = async (req, res, next) => {
    try {
        const Supplier = await db.KF_Suppliers.findByPk(req.params.uuid);

        if (!Supplier) {
            req.flash('error', 'Supplier not found.');
            return res.redirect('/dashboard/KFsupplier');
        }

        res.render(path.join('kashflow', 'viewSupplier'), {
            title: 'Supplier Overview',
            Supplier,
        });
    } catch (error) {
        logger.error('Error reading kashflow Supplier:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

router.get('/supplier/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readSupplier);

module.exports = router;