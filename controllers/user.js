const User = require('../models/user');
const bcrypt = require('bcrypt');
const packageJson = require('../package.json');
const {
    Op
} = require("sequelize");

const renderRegistrationForm = (req, res) => {
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
        const {
            username,
            email,
            password,
            role
        } = req.body;

        // Create a new user in the database
        await User.create({
            username,
            email,
            password,
            role,
        });

        res.send('Registration successful');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

const renderLoginForm = (req, res) => {
    res.render('login', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
        message: req.query.message || '',
    });
};

const loginUser = async (req, res) => {
    try {
        const {
            usernameOrEmail,
            password
        } = req.body;

        // Find the user by username or email
        const user = await User.findOne({
            where: {
                [Op.or]: [{
                        username: usernameOrEmail
                    },
                    {
                        email: usernameOrEmail
                    },
                ],
            },
        });

        // If user is found, compare passwords
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                req.session.user = user;
                const userWithoutPassword = {
                    user
                };
                delete userWithoutPassword.user.password;
                const userJSON = JSON.stringify(userWithoutPassword);
                if (user.role === 'admin') {
                    console.log('User Logged in: \n' + userJSON);
                    return res.redirect('/admin');
                }
                if (user.role === 'subcontractor') {
                    console.log('User Logged in: \n' + userJSON);
                    return res.redirect('/subcontractor');
                }
                console.log('User Logged in: \n' + userJSON);
                return res.redirect('/dashboard');
            } else {
                req.flash('error', 'Invalid password');
                return res.redirect('/login');
            }
        } else {
            req.flash('error', 'Invalid username/email');
            return res.redirect('/login');
        }
    } catch (error) {
        return res.status(500).send('Error: ' + error.message);
    }
};

const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            res.redirect('/login');
        }
        console.log('Session destroyed');
        res.redirect('/login');
    });
};

module.exports = {
    renderRegistrationForm,
    registerUser,
    renderLoginForm,
    loginUser,
    logoutUser,
};