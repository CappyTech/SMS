// routes/user.js

const express = require('express');
const router = express.Router();
const {
    renderRegistrationForm,
    registerUser,
    renderLoginForm,
    loginUser,
    logoutUser,
} = require('../controllers/user');

router.get('/register', renderRegistrationForm);
router.post('/register', registerUser);
router.get('/login', renderLoginForm);
router.post('/login', loginUser);
router.get('/logout', logoutUser);

module.exports = router;