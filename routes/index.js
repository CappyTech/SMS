// routes/index.js
const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');

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
                res.redirect('/admin/subcontractor/create');
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

router.get('/', renderIndex);
router.get('/dashboard', renderDashboard);

const updateAccountSettings = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.session.user.id
            }
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        user.username = req.body.newUsername;
        user.email = req.body.newEmail;

        await user.save();

        req.flash('success', 'Account settings updated successfully');
        res.redirect('/account');
    } catch (error) {
        console.error('Error updating account settings:', error);
        req.flash('error', 'Failed to update account settings');
        res.redirect('/account');
    }
};

const getAccountPage = async (req, res) => {
    try {
        console.log(req.session);
        const user = await User.findOne({
            where: {
                id: req.session.user.id
            }
        });

        res.render('account', {
            user,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            message: req.query.message || '',
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

router.get('/account', getAccountPage);
router.post('/account/settings', updateAccountSettings);

module.exports = router;