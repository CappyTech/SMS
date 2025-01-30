const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');
const { rolePermissions } = require('../../models/sequelize/user');

const renderUserCreateForm = async (req, res, next) => {
    try {
        res.render(path.join('users', 'createUser'), {
            title: 'Create User',
            
        });
    } catch (error) {
        logger.error('Error rendering user create form: ' + error.message);
        req.flash('error', 'Error rendering user create form: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

const renderUserUpdateForm = async (req, res, next) => {
    try {
        const userId = req.params.user;
        const user = await db.Users.findByPk(userId);
        if (user) {
            user.permissions = typeof user.permissions === 'string' 
                ? JSON.parse(user.permissions) 
                : user.permissions || {};
        } else {
            return res.status(404).send('User not found');
        }
        console.log(user.permissions);
        res.render(path.join('users', 'updateUser'), {
            title: 'Update User',
            user,
            rolePermissions: rolePermissions
        });
    } catch (error) {
        logger.error('Error rendering user update form: ' + error.message);
        req.flash('error', 'Error rendering user update form: ' + error.message);
        next(error); // Pass the error to the error handler
    }
};

router.get('/create', authService.ensureAuthenticated, authService.ensureRole('admin'), renderUserCreateForm);
router.get('/update/:user', authService.ensureAuthenticated, authService.ensureRole('admin'), renderUserUpdateForm);

module.exports = router;