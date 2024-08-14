const express = require('express');
const router = express.Router();
const User = require("../../models/user");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const logger = require('../../logger');
const path = require('path'); 

const renderSigninForm = (req, res) => {
    
    res.render(path.join('user', 'signin'), {
        title: 'Sign In',
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
    });
};

const loginUser = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;
        logger.info('Login attempt:', JSON.stringify(req.body, null, 2));
        
        if (!usernameOrEmail || !password) {
            req.flash('error', 'Username and password are required.');
            return res.redirect('/signin');
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
            }
        });

        if (!user) {
            req.flash('error', 'Invalid username.');
            return res.redirect('/signin');
        }

        logger.info('User found: ' + JSON.stringify(user, null, 2));
        logger.info('Stored password hash: ' + user.password);

        const isPasswordValid = await bcrypt.compare(password, user.password);
        logger.info('Password comparison result: ' + isPasswordValid);

        if (!isPasswordValid) {
            req.flash('error', 'Invalid password.');
            return res.redirect('/signin');
        }

        // Save user data in session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissionCreateUser: user.permissionCreateUser,
            permissionReadUser: user.permissionReadUser,
            permissionUpdateUser: user.permissionUpdateUser,
            permissionDeleteUser: user.permissionDeleteUser,
            permissionCreateSubcontractor: user.permissionCreateSubcontractor,
            permissionReadSubcontractor: user.permissionReadSubcontractor,
            permissionUpdateSubcontractor: user.permissionUpdateSubcontractor,
            permissionDeleteSubcontractor: user.permissionDeleteSubcontractor,
            permissionCreateInvoice: user.permissionCreateInvoice,
            permissionReadInvoice: user.permissionReadInvoice,
            permissionUpdateInvoice: user.permissionUpdateInvoice,
            permissionDeleteInvoice: user.permissionDeleteInvoice
        };

        // Save the session explicitly
        req.session.save((err) => {
            if (err) {
                logger.error('Error saving session: ' + err.message);
                req.flash('error', 'An error occurred while logging in. Please try again.');
                return res.redirect('/signin');
            }

            req.flash('success', 'Successfully logged in.');
            res.redirect('/'); // Redirect to the dashboard or desired page
        });

    } catch (error) {
        logger.error('Error during login: ' + error.message);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/signin');
    }
};




const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Error logging out: ' + err.message);
            req.flash('error', 'An error occurred while logging out. Please try again.');
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Clears the session ID cookie
        return res.redirect('/signin');
    });
};

router.get('/signin', renderSigninForm);
router.post('/login', loginUser);
router.get('/logout', logoutUser);

module.exports = router;
