// routes/admin.js

const express = require('express');
const router = express.Router();

const {
    renderUserCreateForm,
    renderAdminDashboard,
    deleteInvoice,
    deleteSubcontractor,
    deleteUser,
    assignUserToSubcontractor,
    unassignUserFromSubcontractor,
    renderInvoiceEditForm,
    viewInvoice,
    viewSubcontractor,
    renderSubcontractorEditForm,
    viewUser,
    createUser,
    renderUserEditForm,
} = require('../controllers/admin');

// Render the admin dashboard
router.get('/', renderAdminDashboard);

// Delete an invoice
router.get('/invoice/delete/:id', deleteInvoice);

// View a subcontractor
router.get('/subcontractor/view/:id', viewSubcontractor);

// Render the edit form for a subcontractor
router.get('/subcontractor/edit/:id', renderSubcontractorEditForm);

// Delete a subcontractor
router.get('/subcontractor/delete/:id', deleteSubcontractor);

// View a user
router.get('/user/view/:id', viewUser);

// Render the edit form for a user
router.get('/user/edit/:id', renderUserEditForm);

// Delete a user
router.get('/user/delete/:id', deleteUser);

// Handle user-subcontractor assignment
router.post('/assign', assignUserToSubcontractor);

// Handle user-subcontractor unassignment
router.post('/unassign', unassignUserFromSubcontractor);

// Render the edit form for an invoice
router.get('/invoice/edit/:id', renderInvoiceEditForm);

// View an invoice
router.get('/invoice/view/:id', viewInvoice);

// Handle the form submission for creating a new user
router.post('/user/create', createUser);

// Render the edit form for a user
router.get('/user/edit/:id', renderUserEditForm);

module.exports = router;