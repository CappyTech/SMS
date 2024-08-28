const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const helpers = require('../../helpers');
const logger = require('../../logger'); 
const path = require('path');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    clearExpired: true,
    checkExpirationInterval: 300000,
    expiration: 43200000,
    createDatabaseTable: true,
    endConnectionOnClose: true,
    disableTouch: false,
    charset: 'utf8mb4_bin',
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
});

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

        // Query sessions related to the current user
        const sessions = await sessionStore.query(`
            SELECT session_id, expires, data 
            FROM sessions
            WHERE data LIKE ?
        `, [`%${req.session.user.id}%`]);

        const activeSessions = [];

        // Parse session data with error handling
        for (const session of sessions) {
            try {
                if (session.data) {
                    const sessionData = JSON.parse(session.data);

                    activeSessions.push({
                        sessionId: session.session_id,
                        ip: sessionData.user ? sessionData.user.ip : 'N/A',
                        userAgent: sessionData.user ? sessionData.user.userAgent : 'Unknown',
                        loginTime: sessionData.user ? sessionData.user.loginTime : 'Unknown',
                        expires: new Date(session.expires * 1000) // Convert expires to JS Date
                    });
                }
            } catch (parseError) {
                logger.error(`Error parsing session data for session ID ${session.session_id}: ${parseError.message}`);
                continue; // Skip this session if there's an error in parsing
            }
        }

        // Render the account page with the QR code and secret
        res.render(path.join('user', 'account'), {
            title: 'Set up Two-Factor Authentication',
            qrCodeUrl: qrCodeUrl,
            secret: secret, // This will be shown in case manual input is needed
            user: user,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            sessions: activeSessions,
        });
    } catch (error) {
        logger.error(`Error setting up TOTP for user ${req.session.user.id}: ${error.message}`);
        req.flash('error', 'An error occurred during TOTP setup.');
        res.redirect('/');
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

const logoutSession = async (req, res) => {
    try {
        const { sessionId } = req.body;

        // Remove the specific session from the store
        sessionStore.destroy(sessionId, (err) => {
            if (err) {
                logger.error('Error destroying session: ' + err.message);
                req.flash('error', 'Failed to log out session.');
                return res.redirect('/account/active-sessions');
            }

            req.flash('success', 'Session logged out successfully.');
            res.redirect('/account/active-sessions');
        });
    } catch (error) {
        logger.error('Error logging out session: ' + error.message);
        req.flash('error', 'Error logging out session.');
        res.redirect('/account/active-sessions');
    }
};

router.get('/account', helpers.ensureAuthenticated, getAccountPage);
router.post('/account/settings', helpers.ensureAuthenticated, updateAccountSettings);
router.post('/account/logout-session', helpers.ensureAuthenticated, logoutSession);

module.exports = router;
