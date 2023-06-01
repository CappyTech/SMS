// controllers/subcontractor.js

const {
    Subcontractor
} = require('../models/subcontractor');

exports.renderProfile = (req, res) => {

    const subcontractor = req.user.Subcontractor;

    res.render('profile', {
        subcontractor
    });
};