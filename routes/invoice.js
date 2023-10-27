// routes/invoice.js

const express = require('express');
const router = express.Router();
const {
    selectSubcontractor,
    renderInvoiceForm,
    createInvoice
} = require('../controllers/invoice');

// Select the subcontractor
router.get('/subcontractor/select/', selectSubcontractor);

// Render the invoice
router.get('/invoice/create/:selected', renderInvoiceForm);

// Handle the submission of the invoice
router.post('/invoice/submit/:selected', createInvoice);

module.exports = router;