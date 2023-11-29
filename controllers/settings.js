// /controllers/settings.js
const express = require('express');
const router = express.Router();

const User = require('../models/user');
const helpers = require('../helpers');
const packageJson = require('../package.json');

// Update the account settings
const updateAccountSettings = async (req, res) => {
    try {
        // Fetch the user data based on the current user's session
        const user = await User.findOne({
            where: {
                id: req.session.user.id
            }
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update the user's settings based on the form data
        user.username = req.body.newUsername;
        user.email = req.body.newEmail;
        // Update any other fields as needed

        await user.save();

        req.flash('success', 'Account settings updated successfully');
        res.redirect('/account');
    } catch (error) {
        console.error('Error updating account settings:', error);
        req.flash('error', 'Failed to update account settings');
        res.redirect('/account');
    }
};

// Display the account page
const getAccountPage = async (req, res) => {
    try {
        console.log(req.session);
        // Fetch the user data based on the current user's session
        const user = await User.findOne({
            where: {
                id: req.session.user.id
            }
        });

        res.render('account', {
            user: user,
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