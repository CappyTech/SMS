// routes/subcontractor.js

const express = require('express');
const router = express.Router();
const {
    renderProfile
} = require('../controllers/account');

router.get('/profile', renderProfile);

module.exports = router;