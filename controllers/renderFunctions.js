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
const Submission = require('../models/submission');

const renderIndex = (req, res) => {
    res.render('index', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
    });
};

const renderDashboard = async (req, res) => {
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
        const invoices = await Invoice.findAll({ order: [['invoiceNumber', 'ASC']] });

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
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};
const renderSubcontractorCreateForm = (req, res) => {
    try {
    console.log(req.session);
        if (req.session.user.role === 'admin') {

            res.render('createSubcontractor', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
            });
        } else {
            return res.status(403).send('Access denied.');
        }
    } catch (error) {
        return req.flash('error', 'Error: ' + error.message);
    }
};
const renderInvoiceCreateForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        console.log(req.session);
        if (req.params.id) {
            const subcontractor = await Subcontractor.findByPk(req.params.id);
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
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
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
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
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
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
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
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

const e500 = async (req, res) => {
    try {
        res.render('500', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
}

// Display form to create a new submission
const renderSubmissionCreateForm = async (req, res) => {
    try {
        const invoices = await Invoice.findAll({ where: { submissionDate: null } });
        res.render('createSubmission', {
            invoices: invoices,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson
        });
    } catch (error) {
        console.error('Error rendering submission create form:', error);
        req.flash('error', 'An error occurred while rendering the submission form.');
        res.redirect('/submission/create');
    }
};

// Display form to update a new submission
const renderSubmissionUpdateForm = async (req, res) => {
    try {
        const submission = await Submission.findByPk({ where: { id: req.params.id } });
        res.render('updateSubmission', {
            submission,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson
        });
    } catch (error) {
        console.error('Error rendering submission update form:', error);
        req.flash('error', 'An error occurred while rendering the submission form.');
        res.redirect('/submission');
    }
};

router.get('/', renderIndex);
router.get('/dashboard', renderDashboard);
router.get('/user/create', renderUserCreateForm);
router.get('/subcontractor/create', renderSubcontractorCreateForm);
router.get('/invoice/create/:id', renderInvoiceCreateForm)
router.get('/user/update/:id', renderUserUpdateForm);
router.get('/subcontractor/update/:id', renderSubcontractorUpdateForm);
router.get('/invoice/update/:id', renderInvoiceUpdateForm);
router.get('/subcontractor/select', selectSubcontractor);
router.get('/500', e500)
router.get('/submission/create', renderSubmissionCreateForm);
router.get('/submission/update/:id', renderSubmissionUpdateForm);

module.exports = router;