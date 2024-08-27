const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const helpers = require('../../helpers');
const logger = require('../../logger'); 
const path = require('path');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Display the account page
const getAccountPage = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { id: req.session.user.id }
        });

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/account');
        }

        // Generate a new TOTP secret if it doesn't already exist
        let secret;
        if (!user.totpSecret) {
            const totpSecret = speakeasy.generateSecret({ length: 20 });
            secret = totpSecret.base32;

            // Encrypt and store the secret in the database
            user.totpSecret = helpers.encrypt(secret);
            await user.save();

            // Log the newly generated secret for debugging purposes
            logger.info(`Generated and encrypted TOTP Secret for user ${user.id}: ${secret}`);
        } else {
            // Decrypt the existing secret if it already exists
            secret = helpers.decrypt(user.totpSecret);
            logger.info(`Using existing decrypted TOTP Secret for user ${user.id}: ${secret}`);
        }

        // Generate the QR code using the stored/decrypted secret
        const otpAuthUrl = speakeasy.otpauthURL({
            secret: secret,
            label: `${user.username} - HeronCS LTD`,
            issuer: 'HeronCS LTD',
            encoding: 'base32'
        });

        // Generate the QR code as a data URL
        const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);

        // Render the account page with the QR code and secret
        res.render(path.join('user', 'account'), {
            title: 'Set up Two-Factor Authentication',
            qrCodeUrl: qrCodeUrl,
            secret: secret, // This will be shown in case manual input is needed
            user: user,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success')
        });
    } catch (error) {
        logger.error(`Error setting up TOTP for user ${req.session.user.id}: ${error.message}`);
        req.flash('error', 'An error occurred during TOTP setup.');
        res.redirect('/account');
    }
};


// Update the account settings
const updateAccountSettings = async (req, res) => {
    // Run validation checks
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(err => err.msg).join('. '));
        return res.redirect('/account');
    }

    try {
        const user = await User.findOne({ where: { id: req.session.user.id } });

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/account');
        }

        // Update basic account details
        user.username = req.body.newUsername;
        user.email = req.body.newEmail;

        await user.save();

        logger.info('Account settings updated successfully');
        req.flash('success', 'Account settings updated successfully');
        res.redirect('/account');
    } catch (error) {
        logger.error('Error updating account settings: ' + error.message);
        req.flash('error', 'Failed to update account settings');
        res.redirect('/account');
    }
};

// TOTP verification route - Verifies the user's TOTP token
const verifyTOTP = async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.session.user.id } });

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/');
        }

        // Ensure the TOTP secret exists
        if (!user.totpSecret) {
            req.flash('error', 'No TOTP secret found. Please set up Two-Factor Authentication.');
            return res.redirect('/');
        }

        // Decrypt the stored TOTP secret
        let decryptedSecret;
        try {
            decryptedSecret = helpers.decrypt(user.totpSecret);
            logger.info(`Decrypted TOTP Secret for user ${user.username}: ${decryptedSecret}`); // Log decrypted secret
        } catch (error) {
            logger.error('Error decrypting TOTP secret:', error.message);
            req.flash('error', 'Failed to decrypt TOTP secret.');
            return res.redirect('/');
        }

        // Log the TOTP token provided by the user
        logger.info(`User-provided TOTP token for user ${user.username}: ${req.body.totpToken}`);

        // Verify the provided TOTP token
        const tokenValidates = speakeasy.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: req.body.totpToken,
            window: 1, // Allow for clock drift of one time step (optional)
        });

        if (tokenValidates) {
            user.totpEnabled = true; // Enable TOTP
            await user.save();
            req.flash('success', 'Two-Factor Authentication enabled successfully.');
            logger.info(`TOTP enabled successfully for user ${user.username}`);
            res.redirect('/');
        } else {
            req.flash('error', 'Invalid TOTP token. Please try again.');
            logger.info(`Invalid TOTP token for user ${user.username}`);
            res.redirect('/');
        }
    } catch (error) {
        logger.error('Error verifying TOTP:', error.message);
        req.flash('error', 'An error occurred during TOTP verification.');
        res.redirect('/');
    }
};


router.get('/account', helpers.ensureAuthenticated, getAccountPage);
router.post('/account/settings', helpers.ensureAuthenticated, updateAccountSettings);
router.post('/account/verify-totp', helpers.ensureAuthenticated, verifyTOTP);

module.exports = router;
