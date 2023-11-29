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

const renderIndex = (req, res) => {
    res.render('index', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        message: req.query.message || '',
    });
};
const renderDashboard = async (req, res) => {
    try {
        console.log(req.session);
        if (req.session.user) {
            const users = await User.findAll({
                where: {
                    id: req.session.user.id,
                },
            });

            const subcontractors = await Subcontractor.findAll({
                where: {
                    userId: req.session.user.id,
                },
            });

            if (subcontractors.length > 0) {
                const subcontractorId = subcontractors[0].id; // Retrieve the correct subcontractorId
                const invoices = await Invoice.findAll({
                    where: {
                        subcontractorId: subcontractorId,
                    },
                });

                const userCount = await User.count({
                    where: {
                        id: req.session.user.id,
                    },
                });

                const subcontractorCount = await Subcontractor.count({
                    where: {
                        userId: req.session.user.id,
                    },
                });

                const invoiceCount = await Invoice.count({
                    where: {
                        subcontractorId: subcontractorId,
                    },
                });

                res.render('dashboard', {
                    userCount,
                    subcontractorCount,
                    invoiceCount,
                    users,
                    subcontractors,
                    invoices,
                    errorMessages: req.flash('error'),
                    successMessage: req.flash('success'),
                    session: req.session,
                    message: req.query.message || '',
                });
            } else {
                res.redirect('/subcontractor/create');
            }
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};
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
            return res.status(403).send('Access denied.');
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
        return res.status(403).send('Access denied.');
    }
};
const renderInvoiceCreateForm = async (req, res) => {
    try {
        console.log(req.session);
        if (req.params.selected) {
            const subcontractor = await Subcontractor.findByPk(req.params.selected);
            if (!subcontractor) {
                req.flash('error', 'Error: No Subcontractors exist.');
                const referrer = '/subcontractor/create';
                res.redirect(referrer);
            }
            return res.render('createInvoice', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                subcontractor,
                message: req.query.message || '',
                slimDateTime: helpers.slimDateTime,
            });
        }
        return res.send('Subcontractor not found');
    } catch (error) {
        return req.flash('error', 'Error: ' + error.message);
    }
};
const renderUserUpdateForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const userId = req.params.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('updateUser', {
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
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.id;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('updateSubcontractor', {
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
            return res.status(403).send('Access denied.');
        }

        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render('updateInvoice', {
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
const selectSubcontractor = async (req, res) => {
    try {
        console.log(req.session);
        let subcontractors;
        if (req.session.user.role === 'admin') {
            subcontractors = await Subcontractor.findAll({});
        } else {
            subcontractors = await Subcontractor.findAll({
                where: {
                    userId: req.session.user.id
                }
            });
        }

        if (subcontractors.length === 0) {
            req.flash('error', 'Error: No Subcontractors exist, Or you don\'t have access to any Subcontractors.');
            const referrer = '/subcontractor/create';
            res.redirect(referrer);
        }

        res.render('selectSubcontractor', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            subcontractors,
            message: req.query.message || '',
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

router.get('/', renderIndex);
router.get('/dashboard', renderDashboard);
router.get('/admin', renderAdminDashboard);
router.get('/user/create', renderUserCreateForm);
router.get('/subcontractor/create', renderSubcontractorCreateForm);
router.get('/invoice/create', renderInvoiceCreateForm)
router.get('/user/update/:id', renderUserUpdateForm);
router.get('/subcontractor/update/:id', renderSubcontractorUpdateForm);
router.get('/invoice/update/:id', renderInvoiceUpdateForm);
router.get('/subcontractor/select', selectSubcontractor);

module.exports = router;