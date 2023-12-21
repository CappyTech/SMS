// /controllers/register.js
const express = require('express');
const router = express.Router();
const packageJson = require("../package.json");
const speakeasy = require("speakeasy");
const User = require("../models/user");
const {Op} = require("sequelize");

const renderRegistrationForm = (req, res) => {
    console.log(req.session);
    res.render('register', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
        message: req.query.message || '',
    });
};

const registerUser = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            length: 20
        });
        const {
            username,
            email,
            password
        } = req.body;

        // Check if the email or username already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{
                    username: username
                },
                    {
                        email: email
                    }
                ]
            }
        });

        if (existingUser) {
            req.flash('error', 'Username or email already exists');
            return res.redirect('/register');
        }

        // Create a new user in the database
        await User.create({
            username,
            email,
            password
        });
        if (role === "admin") {
            res.redirect('/admin');
        }
        if (role === "subcontractor") {
            res.redirect('/dashboard');
        }
        if (role === "user") {
            res.redirect('/account');
        }
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

router.get('/register', renderRegistrationForm);
router.post('/register', registerUser);

module.exports = router;