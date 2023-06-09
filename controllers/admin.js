// controllers/admin.js

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const User = require('../models/user');
const helpers = require('../helpers');

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
            message: req.query.message || '',
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
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
            return res.status(404).send('Invoice not found');
        }

        await invoice.destroy();

        res.send('Invoice deleted successfully');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
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
            return res.status(404).send('Subcontractor not found');
        }

        await subcontractor.destroy();

        res.send('Subcontractor deleted successfully');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
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
            return res.status(404).send('User not found');
        }

        await user.destroy();

        res.send('User deleted successfully');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
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
            return res.status(404).send('Subcontractor or user not found');
        }

        // Assign the user to the subcontractor
        subcontractor.UserId = user.id;
        await subcontractor.save();

        res.redirect('/admin');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
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
            return res.status(404).send('Subcontractor not found');
        }

        // Unassign the user from the subcontractor
        subcontractor.UserId = null;
        await subcontractor.save();

        res.redirect('/admin');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

module.exports = {
    renderAdminDashboard,
    deleteInvoice,
    deleteSubcontractor,
    deleteUser,
    assignUserToSubcontractor,
    unassignUserFromSubcontractor,
};