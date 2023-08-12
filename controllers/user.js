const User = require('../models/user');
const Subcontractor = require('../models/subcontractor');
const bcrypt = require('bcrypt');
const packageJson = require('../package.json');
const {
    Op
} = require("sequelize");
const speakeasy = require('speakeasy');

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
            password,
            role
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
            password,
            role,
            twoFactorSecret: secret.base32,
        });

        res.redirect('/dashbpard');
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

const renderLoginForm = (req, res) => {
    console.log(req.session);
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
            password,
            enteredCode
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

        if (!user) {
            req.flash('error', 'Invalid username/email');
            return res.redirect('/login');
        }

        const subcontractors = await Subcontractor.count({
            where: {
                userId: user.id,
            },
        });

        // Compare passwords if user is found
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            // Verify the entered code against the user's secret key
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: enteredCode,
                window: 1,
            });

            if (verified || !user.twoFactorEnabled) {
                req.session.user = user;
                req.session.user.subcontractors = subcontractors;
                const userWithoutPassword = {
                    ...user.get(),
                    password: undefined
                };
                const userJSON = JSON.stringify(userWithoutPassword);

                if (user.role === 'admin') {
                    console.log('Admin Logged in: \n' + userJSON);
                    return res.redirect('/dashboard');
                }
                if (user.role === 'subcontractor') {
                    console.log('Subcontractor Logged in: \n' + userJSON);
                    return res.redirect('/dashboard');
                }
                console.log('User Logged in: \n' + userJSON);
                return res.redirect('/dashboard');
            } else {
                req.flash('error', 'Invalid 2FA code.');
                return res.redirect('/login');
            }
        } else {
            req.flash('error', 'Invalid password');
            return res.redirect('/login');
        }
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
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