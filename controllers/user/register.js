const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../services/loggerService'); 
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');

const renderRegistrationForm = (req, res) => {
    res.render(path.join('user', 'register'), {
        title: 'Register',
        siteKey: process.env.TURNSTILE_SITE_KEY,
    });
};

const registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const token = req.body['cf-turnstile-response'];
        const ip = req.ip;

        if (!token) {
            logger.error('CAPTCHA verification failed (token missing).');
            req.flash('error', 'CAPTCHA verification failed (token missing).');
            return res.redirect('/user/register');
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
            logger.error('CAPTCHA verification failed.'); // Notify the server
            req.flash('error', 'CAPTCHA verification failed.'); // Notify the user
            return res.redirect('/user/register'); // Redirect to the registration page
        }

        // Check if the email or username already exists
        const existingUser = await db.User.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            logger.error('Username or email already exists'); // Notify the server
            req.flash('error', 'Username or email already exists'); // Notify the user
            return res.redirect('/user/register'); // Redirect to the registration page
        }

        // Create a new user in the database
        await User.create({ username, email, password });
        logger.info('New User Created.'); // Notify the server
        next(error); // Pass the error to the error handler
    } catch (error) {
        logger.error('Error registering user: ' + error.message); // Notify the server
        req.flash('error', 'Error registering user: ' + error.message); // Notify the user
        return res.redirect('/user/register'); // Redirect to the registration page
    }
};

router.get('/register', renderRegistrationForm);
router.post('/register', registerUser);

module.exports = router;
