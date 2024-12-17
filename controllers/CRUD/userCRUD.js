const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');

const { rolePermissions } = require('../../models/sequelize/user');

const schema = Joi.object({
    username: Joi.string().min(1).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('subcontractor', 'employee', 'accountant', 'hmrc', 'admin').required(),
    permissions: Joi.object()
        .pattern(Joi.string(), Joi.boolean()) // Dynamic permissions validation
        .optional() // Permissions field is optional
});

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
        if (!req.params || !req.params.id) {
            return res.status(400).send('Bad Request: Missing user id parameter.');
        }

        const { username, email, role, permissions: incomingPermissions } = req.body;

        // Validate and sanitize permissions
        const validPermissions = rolePermissions[role] || {};
        const updatedPermissions = {};

        if (incomingPermissions) {
            // Allow updates only to valid permission keys
            for (const key in incomingPermissions) {
                if (validPermissions.hasOwnProperty(key)) {
                    updatedPermissions[key] = incomingPermissions[key] === 'true' || incomingPermissions[key] === true;
                }
            }
        }

        // Prepare fields for update
        const updateFields = {
            username,
            email,
            role,
            permissions: updatedPermissions
        };

        // Update the user in the database
        const [affectedRows, updatedUsers] = await db.Users.update(updateFields, {
            where: { id: req.params.id },
            returning: true,
        });

        if (affectedRows > 0 && updatedUsers.length > 0) {
            const updatedUser = updatedUsers[0]; // Safely access the updated user

            req.flash('success', 'User updated successfully.');

            // Update session if the logged-in user is the updated user
            if (req.session.user.id === req.params.id) {
                req.session.user = {
                    ...req.session.user,
                    ...updatedUser.get() // Updated user data
                };
            }
        } else {
            req.flash('error', 'User not found.');
        }

        res.redirect('/user/read/' + req.params.id);

    } catch (error) {
        logger.error('Error updating user: ' + error.message);
        req.flash('error', 'Error updating user: ' + error.message);
        res.redirect('/dashboard/user');
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

router.post('/user/create/', authService.ensureAuthenticated, authService.ensureRole('admin'), createUser);
router.get('/user/read/:id', authService.ensureAuthenticated, authService.ensureRole('admin'), readUser);
router.post('/user/update/:id', authService.ensureAuthenticated, authService.ensureRole('admin'), updateUser);
router.post('/user/delete/:id', authService.ensureAuthenticated, authService.ensureRole('admin'), deleteUser);

module.exports = router;
