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
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
  role: Joi.string().valid('admin', 'user').required(),
});

const createUser = async (req, res) => {
    try {
      const { error, value } = schema.validate(req.body);
      if (error) {
        req.flash('error', 'Invalid input.');
        return res.redirect('/admin');
      }
  
      const { username, email, password, role } = value;
  
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });
  
      if (existingUser) {
        req.flash('error', 'Registration failed.');
        return res.redirect('/admin');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
      });
  
      req.flash('success', 'User created successfully.');
      res.redirect('/admin');
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

    // Input validation could be added here

    if (req.session.user.role !== 'admin') {
        return res.status(403).send('Access denied.');
    }

    const user = await User.findByPk(req.params.id);
    let message = 'User updated.';
    let status = 200;

    if (user) {
        user.username = username;
        user.email = email;
        user.role = role;
        user.permissionCreateUser = permissionCreateUser;
        user.permissionReadUser = permissionReadUser;
        user.permissionUpdateUser = permissionUpdateUser;
        user.permissionDeleteUser = permissionDeleteUser;
        user.permissionCreateSubcontractor = permissionCreateSubcontractor;
        user.permissionReadSubcontractor = permissionReadSubcontractor;
        user.permissionUpdateSubcontractor = permissionUpdateSubcontractor;
        user.permissionDeleteSubcontractor = permissionDeleteSubcontractor;
        user.permissionCreateInvoice = permissionCreateInvoice;
        user.permissionReadInvoice = permissionReadInvoice;
        user.permissionUpdateInvoice = permissionUpdateInvoice;
        user.permissionDeleteInvoice = permissionDeleteInvoice;

        await user.save();
        req.flash('success', message);
    } else {
        message = 'User not found';
        req.flash('error', message);
    }

    const referrer = '/admin';
    res.status(status).redirect(referrer);
  } catch (error) {
    console.error('Error updating user:', error);
    req.flash('error', 'Error updating user: ' + error.message);
    res.status(500).redirect('/');
  }
};
const deleteUser = async (req, res) => {
  try {
    if (req.session.user.role !== 'admin') {
        return res.status(403).send('Access denied. Only admins can delete users.');
    }

    if (req.session.user.id === req.params.id) {
        return res.status(403).send('Access denied. You cannot delete your own account.');
    }

    const user = await User.findByPk(req.params.id);
    let message = 'User deleted successfully';
    let status = 200;

    if (!user) {
        message = 'User not found';
        status = 404;
        req.flash('error', message);
    } else {
        await user.destroy();
        req.flash('success', message);
    }

    const referrer = req.get('referer') || '/admin';
    res.status(status).redirect(referrer);
  } catch (error) {
    req.flash('error', 'Error: ' + error.message);
    res.status(500).redirect(req.get('referer') || '/admin');
  }
};

router.post('/user/create/:selected', createUser);
router.get('/user/read/:id', readUser);
router.post('/user/update/:id', updateUser);
router.get('/user/delete/:id', deleteUser);

module.exports = router;