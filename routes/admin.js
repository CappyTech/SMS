// routes/admin.js

const express = require('express');
const router = express.Router();

const {
    renderAdminDashboard,
    assignUserToSubcontractor,
    unassignUserFromSubcontractor,
    renderUserCreateForm,
    createUser,
    viewUser,
    renderSubcontractorCreateForm,
    createSubcontractor,
    viewSubcontractor,
    viewInvoice,
    renderUserEditForm,
    updateUser,
    renderSubcontractorEditForm,
    updateSubcontractor,
    renderInvoiceEditForm,
    updateInvoice,
    deleteUser,
    deleteSubcontractor,
    deleteInvoice,
} = require('../controllers/admin');

// Render the admin dashboard
router.get('/', renderAdminDashboard);
// Handle user-subcontractor assignment
router.post('/assign', assignUserToSubcontractor);
// Handle user-subcontractor unassignment
router.post('/unassign', unassignUserFromSubcontractor);
// Render form new user
router.get('/user/create', renderUserCreateForm);
// Handle the form submission for creating a new user
router.post('/user/submit', createUser);
// View a user
router.get('/user/view/:id', viewUser);
// Render form new subcontractor
router.get('/subcontractor/create', renderSubcontractorCreateForm);
// Handle the form submission for creating a new subcontractor
router.post('/subcontractor/submit', createSubcontractor);
// View a subcontractor
router.get('/subcontractor/view/:id', viewSubcontractor);
// View an invoice
router.get('/invoice/view/:id', viewInvoice);
// Render the edit form for a user
router.get('/user/edit/:id', renderUserEditForm);
router.post('/user/update/:id', updateUser);
// Render the edit form for a subcontractor
router.get('/subcontractor/edit/:id', renderSubcontractorEditForm);
router.post('/subcontractor/update/:id', updateSubcontractor);
// Render the edit form for an invoice
router.get('/invoice/edit/:id', renderInvoiceEditForm);
router.post('/invoice/update/:id', updateInvoice);
// Delete a user
router.post('/user/delete/:id', deleteUser);
// Delete a subcontractor
router.post('/subcontractor/delete/:id', deleteSubcontractor);
// Delete an invoice
router.post('/invoice/delete/:id', deleteInvoice);

module.exports = router;