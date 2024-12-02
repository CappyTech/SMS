const express = require('express');
const router = express.Router();
const { Op } = require("sequelize");
const logger = require('../../services/loggerService'); 
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');

const renderRegistrationForm = (req, res) => {
    
    res.render(path.join('user', 'register'), {
        title: 'Register',
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        message: req.query.message || '',
    });
};

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the email or username already exists
        const existingUser = await db.User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            logger.error('Username or email already exists');
            req.flash('error', 'Username or email already exists');
            return res.redirect('/register');
        }

        // Create a new user in the database
        await User.create({ username, email, password });
        logger.info('New User Created.');
        return res.redirect('/');
    } catch (error) {
        logger.error('Error registering user: ' + error.message);
        req.flash('error', 'Error registering user: ' + error.message);
        return res.redirect('/register');
    }
};

router.get('/register', renderRegistrationForm);
router.post('/register', registerUser);

module.exports = router;
