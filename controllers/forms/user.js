const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');

const renderUserCreateForm = async (req, res) => {
    try {
        res.render(path.join('users', 'createUser'), {
            title: 'Create User',
            
        });
    } catch (error) {
        logger.error('Error rendering user create form: ' + error.message);
        req.flash('error', 'Error rendering user create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderUserUpdateForm = async (req, res) => {
    try {
        const userId = req.params.user;
        const user = await db.Users.findByPk(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render(path.join('users', 'updateUser'), {
            title: 'Update User',
            user,
            

        });
    } catch (error) {
        logger.error('Error rendering user update form: ' + error.message);
        req.flash('error', 'Error rendering user update form: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/user/create', authService.ensureAuthenticated, authService.ensureRole('admin'), renderUserCreateForm);
router.get('/user/update/:user', authService.ensureAuthenticated, authService.ensureRole('admin'), renderUserUpdateForm);

module.exports = router;