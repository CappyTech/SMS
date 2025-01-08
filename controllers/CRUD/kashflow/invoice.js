const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const path = require('path');
const db = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');

const readInvoice = async (req, res, next) => {
    try {
        const Invoice = await db.KF_Invoices.findByPk(req.params.uuid);

        if (!Invoice) {
            req.flash('error', 'Invoice not found.');
            return res.redirect('/dashboard/KFinvoice');
        }
        Invoice.Lines = typeof Invoice.Lines === 'string' ? JSON.parse(Invoice.Lines) : Invoice.Lines || [];
        res.render(path.join('kashflow', 'viewInvoice'), {
            title: 'Invoice Overview',
            Invoice,
        });
    } catch (error) {
        logger.error('Error reading kashflow Invoice:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

router.get('/kf/invoice/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readInvoice);

module.exports = router;