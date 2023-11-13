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
const viewUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
    
        if (!user) {
          return res.status(404).send('User not found');
        }
    
        res.render('viewUser', {
          user,
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
    const { username, email, role } = req.body;

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

    const userId = req.params.id;

    if (req.session.user.id === userId) {
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

module.exports = {
    createUser,
    viewUser,
    updateUser,
    deleteUser
};