const User = require('../models/user');
const helpers = require('../helpers');
const packageJson = require('../package.json');

// Display the account settings page
const getAccountSettingsPage = async (req, res) => {
    try {
        // Fetch the user data based on the current user's session
        const user = await User.findOne({
            where: {
                id: req.session.user.id
            }
        });

        res.render('accountSettings', {
            user,
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

// Update the account settings
const updateAccountSettings = async (req, res) => {
    try {
        // Fetch the user data based on the current user's session
        const user = await User.findOne({
            where: {
                id: req.session.user.id
            }
        });

        // Update the user's settings based on the form data
        user.username = req.body.username;
        user.email = req.body.email;
        // Update any other fields as needed

        await user.save();

        req.flash('success', 'Account settings updated successfully');
        res.redirect('/account/settings');
    } catch (error) {
        req.flash('error', 'Failed to update account settings');
        res.redirect('/account/settings');
    }
};

module.exports = {
    getAccountSettingsPage,
    updateAccountSettings,
};