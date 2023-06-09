// routes/admin.js

const express = require('express');
const router = express.Router();

const {
    renderAdminDashboard,
    deleteInvoice,
    deleteSubcontractor,
    deleteUser,
    assignUserToSubcontractor,
    unassignUserFromSubcontractor,
} = require('../controllers/admin');


// Render the admin dashboard
router.get('/', renderAdminDashboard);
// Delete an invoice
router.get('/invoice/delete/:id', deleteInvoice);
// Delete a subcontractor
router.get('/subcontractor/delete/:id', deleteSubcontractor);
// Delete a user
router.get('/user/delete/:id', deleteUser);
// Handle user-subcontractor assignment
router.post('/assign', assignUserToSubcontractor);
// Handle user-subcontractor unassignment
router.post('/unassign', unassignUserFromSubcontractor);


module.exports = router;