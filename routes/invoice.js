// routes/invoice.js

const express = require('express');
const router = express.Router();
const {
    selectSubcontractor,
    renderInvoiceForm,
    submitInvoice,
    getAllInvoices,
} = require('../controllers/invoice');

// Select the subcontractor
router.get('/subcontractor/select', selectSubcontractor);

// Render the invoice
router.get('/invoice/create/:selected', renderInvoiceForm);

// Handle the submission of the invoice
router.post('/invoice/submit/:selected', submitInvoice);

// Handle the submission of the invoice
router.get('/invoices', getAllInvoices);

module.exports = router;