const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const axios = require('axios');

const renderSigninForm = (req, res) => {
    res.render(path.join('user', 'signin'), {
        title: 'Sign In',
        siteKey: process.env.TURNSTILE_SITE_KEY,
    });
};

const loginUser = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;
        const token = req.body['cf-turnstile-response'];
        const agent = req.useragent || {};
        const ip = req.ip;

        if (!token) {
            logger.error('CAPTCHA token missing.');
            req.flash('error', 'CAPTCHA token missing.');
            return res.redirect('/user/signin');
        }

        const verifyResponse = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token,
                remoteip: ip
            })
        );

        if (!verifyResponse.data.success) {
            logger.error('CAPTCHA verification failed.');
            req.flash('error', 'CAPTCHA verification failed.');
            return res.redirect('/user/signin');
        }

        if (!usernameOrEmail || !password) {
            logger.error('Username and password are required.');
            req.flash('error', 'Username and password are required.');
            return res.redirect('/user/signin');
        }

        const user = await db.Users.findOne({
            where: {
                [db.Sequelize.Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
            }
        });

        if (!user) {
            logger.error('Invalid username.');
            req.flash('error', 'Invalid username.');
            return res.redirect('/user/signin');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.error('Invalid password.');
            req.flash('error', 'Invalid password.');
            return res.redirect('/user/signin');
        }

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

            return res.redirect('/user/2fa');
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
        
        req.session.save((error) => {
            if (error) {
                logger.error('Error saving session: ' + error.message);
                req.flash('error', 'An error occurred while logging in. Please try again.');
                return res.redirect('/user/signin');
            }
            logger.info('Successfully logged in.');
            req.flash('success', 'Successfully logged in.');
            return res.redirect('/');
        });

    } catch (error) {
        logger.error('Error during login: ' + error.message);
        req.flash('error', 'An error occurred during login. Please try again.');
        return res.redirect('/user/signin');
    }
};

const logoutUser = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            logger.error('Error logging out: ' + error.message);
            req.flash('error', 'An error occurred while logging out. Please try again.');
            next(error); // Pass the error to the error handler
        }
        res.clearCookie('connect.sid');
        return res.redirect('/user/signin');
    });
};

router.get('/signin', renderSigninForm);
router.post('/login', loginUser);
router.get('/logout', logoutUser);

module.exports = router;
