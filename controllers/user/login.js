const express = require('express');
const router = express.Router();
const packageJson = require("../../package.json");
const User = require("../../models/user");
const { Op } = require("sequelize");
const Subcontractor = require("../../models/subcontractor");
const bcrypt = require("bcrypt");
const logger = require('../../logger');
const path = require('path'); 

const renderSigninForm = (req, res) => {
    
    res.render(path.join('user', 'signin'), {
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
            password
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
            logger.error('Invalid username/email:' + error.message);
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
            req.session.user = user;
            req.session.user.subcontractors = subcontractors;
            
            logger.info('User Logged in');
            req.flash('success', 'Logged In');
            return res.redirect('/');
        
         } else {
            logger.error('Error Invalid password:' + error.message);
            req.flash('error', 'Invalid password');
            return res.redirect('/signin');
        };
    } catch (error) {
        logger.error('Error logging in:' + error.message);
        req.flash('error', 'Error logging in:' + error.message);
        res.redirect('/error');
    };
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
