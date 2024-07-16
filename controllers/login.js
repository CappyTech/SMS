const express = require('express');
const router = express.Router();
const packageJson = require("../package.json");
const User = require("../models/user");
const { Op } = require("sequelize");
const Subcontractor = require("../models/subcontractor");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const logger = require('../logger'); // Import the logger

const renderSigninForm = (req, res) => {
    logger.info('Session data:', req.session);
    res.render('signin', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson
    });
};

const loginUser = async (req, res) => {
    try {
        const {
            usernameOrEmail,
            password,
            enteredCode
        } = req.body;

        // Find the user by username or email
        const user = await User.findOne({
            where: {
                [Op.or]: [{
                    username: usernameOrEmail
                },
                    {
                        email: usernameOrEmail
                    },
                ],
            },
        });

        if (!user) {
            req.flash('error', 'Invalid username/email');
            return res.redirect('/signin');
        }

        const subcontractors = await Subcontractor.count({
            where: {
                userId: user.id,
            },
        });

        // Compare passwords if user is found
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            // Verify the entered code against the user's secret key
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: enteredCode,
                window: 1,
            });

            if (verified || !user.twoFactorEnabled) {
                req.session.user = user;
                req.session.user.subcontractors = subcontractors;
                const userWithoutPassword = {
                    ...user.get(),
                    password: undefined
                };
                const userJSON = JSON.stringify(userWithoutPassword);

                if (user.role === 'admin') {
                    logger.info('Admin Logged in:', userJSON);
                    return res.redirect('/dashboard');
                }
                if (user.role === 'subcontractor') {
                    logger.info('Subcontractor Logged in:', userJSON);
                    return res.redirect('/dashboard');
                }
                logger.info('User Logged in:', userJSON);
                return res.redirect('/dashboard');
            } else {
                req.flash('error', 'Invalid 2FA code.');
                return res.redirect('/signin');
            }
        } else {
            req.flash('error', 'Invalid password');
            return res.redirect('/signin');
        }
    } catch (error) {
        logger.error('Error logging in:', error.message);
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Error logging out:', err);
            res.redirect('/signin');
        } else {
            logger.info('Session destroyed');
            res.redirect('/signin');
        }
    });
};

router.get('/signin', renderSigninForm);
router.post('/login', loginUser);
router.get('/logout', logoutUser);

module.exports = router;
