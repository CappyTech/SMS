// /controllers/userCRUD.js

const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const {
  Op
} = require('sequelize');

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
    permissionReadSubcontractor : Joi.boolean(),
    permissionUpdateSubcontractor: Joi.boolean(),
    permissionDeleteSubcontractor: Joi.boolean(),
    permissionCreateInvoice: Joi.boolean(),
    permissionReadInvoice: Joi.boolean(),
    permissionUpdateInvoice: Joi.boolean(),
    permissionDeleteInvoice: Joi.boolean(),
});

const createUser = async (req, res) => {
    try {
      const { error, value } = schema.validate(req.body);
      if (error) {
        req.flash('error', 'Invalid input.');
        return res.redirect('/dashboard');
      }
  
      const { username, email, password, role } = value;
  
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });
  
      if (existingUser) {
        req.flash('error', 'Registration failed.');
        return res.redirect('/dashboard');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
      });
  
      req.flash('success', 'User created successfully.');
      res.redirect('/dashboard');
    } catch (error) {
      req.flash('error', 'An error occurred.');
      res.redirect('/error');
    }
  };
const readUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
    
        if (!user) {
          return res.status(404).send('User not found');
        }
    
        res.render('viewUser', {
          user,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
          packageJson,
          slimDateTime: helpers.slimDateTime,
          formatCurrency: helpers.formatCurrency,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred.');
      }
};
const updateUser = async (req, res) => {
    try {
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

        // Validate the session user state
        if (!req.session || !req.session.user) {
            return res.status(403).send('Invalid session or user.');
        }

        // Check if the logged-in user is an admin and has the permission to create users.
        if (req.session.user.role !== 'admin' && !req.session.user.permissionCreateUser) {
            return res.status(403).send('Access denied.');
        }

        // Check if User exists and has an update method
        if (!User || typeof User.update !== 'function') {
            console.error('Error: User model or update method not found!');
            return res.status(500).send('Server Error.');
        }

        // Verify if req.params and req.params.id exist
        if (!req.params || !req.params.id) {
            return res.status(400).send('Bad Request: Missing user id parameter.');
        }

        // Then update the user data.
        const updatedUser = await User.update({
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
        },{
            where: { id: req.params.id }
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
                    }
                }
            }
        } else {
            req.flash('error', 'User not found.');
        }

        const referer = req.get('referer') ? req.get('referer') : '/dashboard';
        res.redirect(referer);

    } catch (error) {
        console.error('Error updating user:', error);
        req.flash('error', 'Error updating user: ' + error.message);
        res.status(500).redirect('/');
    }
}
const deleteUser = async (req, res) => {
  try {
    if (req.session.user.role !== 'admin' && !req.session.user.permissionDeleteUser) {
        return res.status(403).send('Access denied. Only admins can delete users.');
    }

    if (req.session.user.id === req.params.id) {
        return res.status(403).send('Access denied. You cannot delete your own account.');
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
        req.flash('error', 'User not found');
    } else {
        await user.destroy();
        req.flash('success', 'User deleted successfully');
    }

      const referer = req.get('referer') ? req.get('referer') : '/dashboard';
    res.redirect(referer);
  } catch (error) {
      console.error('Error deleting user:', error);
    req.flash('error', 'Error: ' + error.message);
    const referer = req.get('referer') ? req.get('referer') : '/dashboard';
    res.status(500).redirect(referer);
  }
};

router.post('/user/create/:selected', createUser);
router.get('/user/read/:id', readUser);
router.post('/user/update/:id', updateUser);
router.get('/user/delete/:id', deleteUser);

module.exports = router;