const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const schema = Joi.object({
    username: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('subcontractor', 'employee', 'accountant', 'hmrc', 'admin').required(),
    permissionCreateUser: Joi.boolean(),
    permissionReadUser: Joi.boolean(),
    permissionUpdateUser: Joi.boolean(),
    permissionDeleteUser: Joi.boolean(),
    permissionCreateSubcontractor: Joi.boolean(),
    permissionReadSubcontractor: Joi.boolean(),
    permissionUpdateSubcontractor: Joi.boolean(),
    permissionDeleteSubcontractor: Joi.boolean(),
    permissionCreateInvoice: Joi.boolean(),
    permissionReadInvoice: Joi.boolean(),
    permissionUpdateInvoice: Joi.boolean(),
    permissionDeleteInvoice: Joi.boolean(),
});
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');

const createUser = async (req, res) => {
    try {
        const { errors, value } = schema.validate(req.body);
        if (errors) {
            req.flash('error', 'Invalid input.' + errors);
            return res.redirect('/');
        }
        const { username, email, password, role } = value;
        const existingUser = await db.Users.findOne({
            where: {
                [db.Sequelize.Op.or]: [{ username }, { email }],
            },
        });
        if (existingUser) {
            req.flash('error', 'Registration failed.');
            return res.redirect('/');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.Users.create({
            username,
            email,
            password: hashedPassword,
            role,
            subcontractorId: null,
            employeeId: null,
            clientId: null,
        });
        req.flash('success', 'User created successfully.');
        res.redirect('/');
    } catch (error) {
        logger.error('Error creating user: ' + error.message);
        req.flash('error', 'An error occurred.');
        res.redirect('/');
    }
};

const readUser = async (req, res) => {
    try {
        // Verify if req.params and req.params.id exist
        if (!req.params || !req.params.id) {
            return res.status(400).send('Bad Request: Missing user id parameter.');
        }

        const user = await db.Users.findByPk(req.params.id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render(path.join('users', 'viewUser'), {
            title: 'User',
            user,
        });
    } catch (error) {
        logger.error('Error reading user:  ', error.message);
        res.status(500).send('An error occurred.');
    }
};

const updateUser = async (req, res) => {
    try {
        // Verify if req.params and req.params.id exist
        if (!req.params || !req.params.id) {
            return res.status(400).send('Bad Request: Missing user id parameter.');
        }

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const {
            username,
            email,
            role,
            permissionCreateUser,
            permissionReadUser,
            permissionUpdateUser,
            permissionDeleteUser,
            permissionCreateSubcontractor,
            permissionReadSubcontractor,
            permissionUpdateSubcontractor,
            permissionDeleteSubcontractor,
            permissionCreateInvoice,
            permissionReadInvoice,
            permissionUpdateInvoice,
            permissionDeleteInvoice
        } = req.body;

        // Then update the user data.
        const updatedUser = await Users.update({
            username,
            email,
            role,
            permissionCreateUser,
            permissionReadUser,
            permissionUpdateUser,
            permissionDeleteUser,
            permissionCreateSubcontractor,
            permissionReadSubcontractor,
            permissionUpdateSubcontractor,
            permissionDeleteSubcontractor,
            permissionCreateInvoice,
            permissionReadInvoice,
            permissionUpdateInvoice,
            permissionDeleteInvoice
        }, {
            where: { id: req.params.id },
            returning: true, // To get the updated user data
        });

        if (updatedUser[0] !== 0) {
            req.flash('success', 'User updated.');

            // Check if the updated user is the same as the logged-in user
            if (req.session.user.id === req.params.id) {
                // Check for the existence of updatedUser[1][0].dataValues
                if (updatedUser[1] && updatedUser[1][0] && updatedUser[1][0].dataValues) {
                    // Then update the session user properties
                    req.session.user = {
                        ...req.session.user,
                        ...updatedUser[1][0].dataValues
                    };
                }
            }
        } else {
            req.flash('error', 'User not found.');
            res.redirect('/dashboard/user');
        }
        res.redirect('/user/read/' + req.params.id);
    } catch (error) {
        logger.error('Error updating user:  ', error.message);
        req.flash('error', 'Error updating user: ' + error.message);
        res.redirect('/');
    }
};

const deleteUser = async (req, res) => {
    try {
        if (req.session.user.id === req.params.id) {
            return res.status(403).send('Access denied. You cannot delete your own account.');
        }

        const user = await db.Users.findByPk(req.params.id);
        if (!user) {
            req.flash('error', 'User not found');
            res.redirect('/dashboard/user');
        } else {
            await user.destroy();
            req.flash('success', 'User deleted successfully');
            res.redirect('/dashboard/user');
        }
    } catch (error) {
        logger.error('Error deleting user:  ', error.message);
        req.flash('error', 'Error deleting user: ' + error.message);
        res.redirect('/');
    }
};

router.get('/fetch/user/:id', async (req, res) => {
    try {
        const user = await db.Users.findAll({
            where: { id: req.params.id },
            order: [['createdAt', 'ASC']],
        });

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.post('/user/create/', authService.ensureAuthenticated, authService.ensurePermission(['permissionCreateUser']), createUser);
router.get('/user/read/:id', authService.ensureAuthenticated, authService.ensurePermission(['permissionReadUser']), readUser);
router.post('/user/update/:id', authService.ensureAuthenticated, authService.ensurePermission(['permissionUpdateUser']), updateUser);
router.post('/user/delete/:id', authService.ensureAuthenticated, authService.ensurePermission(['permissionDeleteUser']), deleteUser);

module.exports = router;
