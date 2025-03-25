const express = require('express');
const router = express.Router();

const renderIndex = (req, res) => {
    res.render('index', {
        title: 'Home',
    });
};

router.get('/', renderIndex);

module.exports = router;
