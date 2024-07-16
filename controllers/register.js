const express = require('express');
const router = express.Router();
const packageJson = require("../package.json");
const speakeasy = require("speakeasy");
const User = require("../models/user");
const { Op } = require("sequelize");
const logger = require('../logger'); // Import the logger

const renderRegistrationForm = (req, res) => {
    logger.info('Session data:', req.session);
    res.render('register', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
        message: req.query.message || '',
    });
};

const registerUser = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({ length: 20 });
        const { username, email, password } = req.body;

        // Check if the email or username already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            req.flash('error', 'Username or email already exists');
            return res.redirect('/register');
        }

        // Create a new user in the database
        await User.create({ username, email, password });
        res.redirect('/');
    } catch (error) {
        logger.error('Error registering user:', error.message);
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

router.get('/register', renderRegistrationForm);
router.post('/register', registerUser);

module.exports = router;
