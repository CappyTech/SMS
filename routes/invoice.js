// routes/invoice.js

const express = require('express');
const router = express.Router();
const {
    selectSubcontractor,
    renderInvoiceForm,
    createInvoice,
    getAllInvoices
} = require('../controllers/invoice');

// Select the subcontractor
router.get('/invoice/select', selectSubcontractor);

// Render the invoice
router.get('/invoice/create/:selected', renderInvoiceForm);

// Handle the submission of the invoice
router.post('/invoice/create', createInvoice);

// Fetch all invoices
router.get('/invoices', getAllInvoices);

module.exports = router;