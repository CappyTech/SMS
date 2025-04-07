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

module.exports = router;
