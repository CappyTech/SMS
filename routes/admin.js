// routes/admin.js

const express = require('express');
const router = express.Router();

const {
    renderAdminDashboard,
    deleteInvoice,
    deleteSubcontractor,
    deleteUser
} = require('../controllers/admin');


// Render the admin dashboard
router.get('/', renderAdminDashboard);
// Delete an invoice
router.get('/invoice/delete/:id', deleteInvoice);
// Delete a subcontractor
router.get('/subcontractor/delete/:id', deleteSubcontractor);
// Delete a user
router.get('/user/delete/:id', deleteUser);



module.exports = router;