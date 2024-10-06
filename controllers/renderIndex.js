const express = require('express');
const router = express.Router();

const renderIndex = (req, res) => {
    res.render('index', {
        title: 'Home',
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
    });
};

router.get('/', renderIndex);

module.exports = router;
