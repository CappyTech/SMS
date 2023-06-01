const express = require('express');
const router = express.Router();
const {
    renderInvoiceForm,
    createInvoice,
    getAllInvoices
} = require('../controllers/invoice');

// Render the invoice creation form
router.get('invoice/create', renderInvoiceForm);

// Handle the submission of the invoice creation form
router.post('invoice/create', createInvoice);

// Fetch all invoices
router.get('/dashboard', getAllInvoices);

module.exports = router;