const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const logger = require('../../services/loggerService');
const path = require('path');
const speakeasy = require('speakeasy');
const db = require('../../services/sequelizeDatabaseService');

const renderSigninForm = (req, res) => {
    
    res.render(path.join('user', 'signin'), {
        title: 'Sign In',
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
    });
};

const loginUser = async (req, res, next) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            req.flash('error', 'Username and password are required.');
            return res.redirect('/signin');
        }

        const user = await db.Users.findOne({
            where: {
                [db.Sequelize.Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
            }
        });

        if (!user) {
            req.flash('error', 'Invalid username.');
            return res.redirect('/signin');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            req.flash('error', 'Invalid password.');
            return res.redirect('/signin');
        }

        const agent = req.useragent || {};
        const ip = req.ip;

        if (user.totpEnabled) {
            req.session.userPending2FA = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                loginTime: new Date().toISOString(),
                ip: ip,
                userAgent: {
                    browser: agent.browser || 'Unknown',
                    version: agent.version || 'Unknown',
                    os: agent.os || 'Unknown',
                    platform: agent.platform || 'Unknown',
                },
            };

            return res.redirect('/2fa');
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            loginTime: new Date().toISOString(),
            ip: ip,
            userAgent: {
                browser: agent.browser || 'Unknown',
                version: agent.version || 'Unknown',
                os: agent.os || 'Unknown',
                platform: agent.platform || 'Unknown',
            },
        };
        
        req.session.save((err) => {
            if (err) {
                logger.error('Error saving session: ' + err.message);
                req.flash('error', 'An error occurred while logging in. Please try again.');
                return res.redirect('/signin');
            }

            req.flash('success', 'Successfully logged in.');
            next(error); // Pass the error to the error handler
        });

    } catch (error) {
        logger.error('Error during login: ' + error.message);
        req.flash('error', 'An error occurred during login. Please try again.');
        return res.redirect('/signin');
    }
};

const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Error logging out: ' + err.message);
            req.flash('error', 'An error occurred while logging out. Please try again.');
            next(error); // Pass the error to the error handler
        }
        res.clearCookie('connect.sid');
        return res.redirect('/signin');
    });
};

const render2FAPage = (req, res) => {
    if (!req.session.userPending2FA) {
        return res.redirect('/signin');
    }

    res.render(path.join('user', '2fa'), {
        title: 'Two-Factor Authentication',
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
    });
};

const verify2FA = async (req, res, next) => {
    try {
        if (!req.session.userPending2FA) {
            req.flash('error', 'Invalid session. Please sign in again.');
            return res.redirect('/signin');
        }

        const { totpToken } = req.body;

        const user = await db.Users.findOne({
            where: { id: req.session.userPending2FA.id }
        });

        if (!user) {
            req.flash('error', 'User not found. Please sign in again.');
            return res.redirect('/signin');
        }

        const agent = req.useragent || {};
        const ip = req.ip;

        const decryptedSecret = user.totpSecret;
        const tokenValidates = speakeasy.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: totpToken,
            window: 1
        });

        if (!tokenValidates) {
            req.flash('error', 'Invalid 2FA code. Please try again.');
            return res.redirect('/2fa');
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            loginTime: new Date().toISOString(),
            ip: ip,
            userAgent: {
                browser: agent.browser || 'Unknown',
                version: agent.version || 'Unknown',
                os: agent.os || 'Unknown',
                platform: agent.platform || 'Unknown',
            },
        };

        delete req.session.userPending2FA;

        req.session.save((err) => {
            if (err) {
                logger.error('Error saving session: ' + err.message);
                req.flash('error', 'An error occurred while logging in. Please try again.');
                return res.redirect('/signin');
            }

            req.flash('success', 'Successfully logged in.');
            next(error); // Pass the error to the error handler
        });

    } catch (error) {
        logger.error('Error during 2FA verification: ' + error.message);
        req.flash('error', 'An error occurred during 2FA verification. Please try again.');
        return res.redirect('/2fa');
    }
};

router.get('/signin', renderSigninForm);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/2fa', render2FAPage);
router.post('/2fa', verify2FA);

module.exports = router;
