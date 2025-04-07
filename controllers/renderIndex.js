const express = require('express');
const fs = require('fs');
const path = require('path');
const authService = require('../services/authService');
const router = express.Router();

const renderIndex = (req, res) => {
    res.render('index', {
        title: 'Home',
    });
};

router.get('/', renderIndex);

router.get('/logs/app.log',
    authService.ensureAuthenticated,
    authService.ensureRole('admin'),
    (req, res) => {
        const logPath = path.join(__dirname, '..', 'logs', 'app.log');
        // stream or return the file
    }
);

module.exports = router;
