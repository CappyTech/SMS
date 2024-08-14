const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');

const path = require('path');
const User = require('../../models/user');

const renderUserCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        res.render(path.join('users', 'createUser'), {
            title: 'Create User',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
            
        });
    } catch (error) {
        logger.error('Error rendering user create form:' + error.message);
        req.flash('error', 'Error rendering user create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderUserUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const userId = req.params.user;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render(path.join('users', 'updateUser'), {
            title: 'Update User',
            user,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
            
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering user update form:' + error.message);
        req.flash('error', 'Error rendering user update form: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/user/create', renderUserCreateForm);
router.get('/user/update/:user', renderUserUpdateForm);

module.exports = router;