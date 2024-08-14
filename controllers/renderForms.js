const express = require('express');
const router = express.Router();

const renderIndex = (req, res) => {
    res.render('index', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        
    });
};

router.get('/', renderIndex);

module.exports = router;
