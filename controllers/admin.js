// controllers/admin.js

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const User = require('../models/user');
const helpers = require('../helpers');


// Render the create form for a user
const renderUserCreateForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can create users.');
        }

        res.render('createUser', {
            session: req.session,
            packageJson,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Render the admin dashboard
const renderAdminDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        console.log(req.session);
        const userCount = await User.count();
        const subcontractorCount = await Subcontractor.count();
        const invoiceCount = await Invoice.count();

        const users = await User.findAll();
        const subcontractors = await Subcontractor.findAll();
        const invoices = await Invoice.findAll();

        //const user = await User.findByPk();

        res.render('adminDashboard', {
            userCount,
            subcontractorCount,
            invoiceCount,
            users,
            subcontractors,
            invoices,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
            message: req.query.message || '',
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.header('Referer') || '/';
        res.redirect(referrer);
    }
};

// Delete an invoice
const deleteInvoice = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete invoices.');
        }

        const invoiceId = req.params.id;
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            // res.status(404).send('Invoice not found');
            return req.flash('error', 'Invoice not found');
        }

        await invoice.destroy();

        res.send('Invoice deleted successfully');
        req.flash('success', 'Invoice deleted successfully');
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.header('Referer') || '/';
        res.redirect(referrer);
    }
};

const deleteSubcontractor = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete subcontractors.');
        }

        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (!subcontractor) {
            // res.status(404).send('Subcontractor not found');
            return req.flash('error', 'Subcontractor not found');
        }

        await subcontractor.destroy();

        req.flash('success', 'Subcontractor deleted successfully');
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    }
};

const deleteUser = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete users.');
        }
        // Check if the user is trying to delete their own account
        if (req.session.user.id === userId) {
            return res.status(403).send('Access denied. You cannot delete your own account.');
        }

        const user = await User.findByPk(req.params.id);

        if (!user) {
            // res.status(404).send('User not found');
            return req.flash('error', 'User not found');
        }

        await user.destroy();

        req.flash('success', 'User deleted successfully');
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    }
};

const assignUserToSubcontractor = async (req, res) => {
    try {
        const {
            subcontractorId,
            userId
        } = req.body;

        // Find the subcontractor and user based on their IDs
        const subcontractor = await Subcontractor.findByPk(subcontractorId);
        const user = await User.findByPk(userId);

        if (!subcontractor || !user) {
            // res.status(404).send('Subcontractor or user not found');
            return req.flash('error', 'Subcontractor or user not found');
        }

        // Assign the user to the subcontractor
        subcontractor.UserId = user.id;
        await subcontractor.save();

        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    }
};

const unassignUserFromSubcontractor = async (req, res) => {
    try {
        const {
            subcontractorId
        } = req.body;

        // Find the subcontractor based on the ID
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            // res.status(404).send('Subcontractor not found');
            return req.flash('error', 'Subcontractor not found');
        }

        // Unassign the user from the subcontractor
        subcontractor.UserId = null;
        await subcontractor.save();

        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    }
};

// Render the edit form for an invoice
const renderInvoiceEditForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can edit invoices.');
        }

        const invoiceId = req.params.id;
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render('editInvoice', {
            invoice,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// View an invoice
const viewInvoice = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can view invoices.');
        }

        const invoiceId = req.params.id;
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render('viewInvoice', {
            invoice,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// View a subcontractor
const viewSubcontractor = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can view subcontractors.');
        }

        const subcontractorId = req.params.id;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('viewSubcontractor', {
            subcontractor,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Render the edit form for a subcontractor
const renderSubcontractorEditForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.id;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('editSubcontractor', {
            subcontractor,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// View a user
const viewUser = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can view users.');
        }

        const userId = req.params.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('viewUser', {
            user,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Render the edit form for a user
const renderUserEditForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can edit users.');
        }

        const userId = req.params.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('editUser', {
            user,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

module.exports = {
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
    renderUserEditForm,
};