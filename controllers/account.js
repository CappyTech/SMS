// controllers/account.js
const User = require('../models/user');
const helpers = require('../helpers');
const packageJson = require('../package.json');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

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

// Generate QR code data
const generateQRCodeData = () => {
    // Replace this with your code to generate the QR code data using the speakeasy library or any other QR code generation library of your choice
    // Example:
    const secret = speakeasy.generateSecret({
        length: 20
    });
    const qrCodeData = speakeasy.otpauthURL({
        secret: secret.base32,
        label: 'SMS',
        issuer: 'HeronCS LTD',
    });
    return qrCodeData;
};

// Generate manual code
const generateManualCode = () => {
    const length = 6; // Set the desired length of the manual code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }

    return code;
};


// Generate the QR code for enabling 2FA
const generateQRCode = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.session.user.id
            }
        });

        const qrCodeData = generateQRCodeData();
        const manualCode = generateManualCode();

        // Generate the QR code as a data URL
        const qrCodeDataURL = await qrcode.toDataURL(qrCodeData);

        // Render the enable2FA view with the QR code data URL
        res.render('enable2FA', {
            manualCode,
            qrCodeDataURL,
            user,
            error: req.flash('error'),
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

// Submit enable2FA form
const submitEnable2FA = async (req, res) => {
    try {
        const {
            otpCode,
            manualCode
        } = req.body;

        console.log('otpCode:', otpCode);
        console.log('manualCode:', manualCode);

        const user = await User.findByPk(req.session.user.id);

        // Verify the entered code against the user's secret key
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: otpCode,
            window: 1
        });

        if (verified) {
            // Update the user's settings to enable 2FA
            user.twoFactorEnabled = true;
            user.twoFactorSecret = verified.secret;
            await user.save();

            req.flash('success', '2FA enabled successfully');
            res.redirect('/account/settings');
        } else {
            req.flash('error', 'Invalid code. Please try again.');
            res.redirect('/account/settings');
        }
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        req.flash('error', 'Failed to enable 2FA');
        res.redirect('/account/settings');
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

        console.log('enable2FA:', req.body.enable2FA);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update the user's settings based on the form data
        user.username = req.body.newUsername;
        user.email = req.body.newEmail;
        // Update any other fields as needed

        // Check if 2FA is enabled
        if (req.body.enable2FA === 'on') {
            // Enable 2FA
            const secret = speakeasy.generateSecret({
                length: 20
            });
            user.twoFactorSecret = secret.base32;
            user.twoFactorEnabled = true;
        } else {
            // Disable 2FA
            user.twoFactorSecret = null;
            user.twoFactorEnabled = false;
        }

        console.log('user:', user);

        await user.save();

        req.flash('success', 'Account settings updated successfully');
        res.redirect('/account/settings');
    } catch (error) {
        console.error('Error updating account settings:', error);
        req.flash('error', 'Failed to update account settings');
        res.redirect('/account/settings');
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

module.exports = {
    getAccountPage,
    getAccountSettingsPage,
    generateQRCode,
    updateAccountSettings,
    submitEnable2FA,
};