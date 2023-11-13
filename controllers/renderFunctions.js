// /controllers/renderfunctions.js

const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');
const {
    Op
} = require('sequelize');

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
const renderSubcontractorCreateForm = (req, res) => {
    console.log(req.session);
    if (req.session.user.role === 'admin') {

        res.render('createSubcontractor', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            message: req.query.message || '',
        });
    } else {
        return res.status(403).send('Access denied. Only admins can create subcontractors.');
    }
};
const renderUserUpdateForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can update users.');
        }

        const userId = req.params.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('UpdateUser', {
            user,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};
const renderSubcontractorUpdateForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can update subcontractors.');
        }

        const subcontractorId = req.params.id;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('UpdateSubcontractor', {
            subcontractor,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};
const renderInvoiceUpdateForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can update invoices.');
        }

        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render('UpdateInvoice', {
            invoice,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};


router.get('/admin', renderAdminDashboard);
router.get('/user/create', renderUserCreateForm);
router.get('/subcontractor/create', renderSubcontractorCreateForm);
router.get('/user/update', renderUserUpdateForm);
router.get('/subcontractor/update', renderSubcontractorUpdateForm);
router.get('/invoice/update', renderInvoiceUpdateForm);

module.exports = router;