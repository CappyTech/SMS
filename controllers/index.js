// controllers/index.js

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const renderIndex = (req, res) => {
    res.render('index', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
        message: req.query.message || '',
    });
};

const renderDashboard = async (req, res) => {
    try {
        if (req.session.user) {

            const subcontractors = await Subcontractor.findAll();
            const invoices = await Invoice.findAll();

            res.render('dashboard', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                message: req.query.message || '',
                slimDateTime: helpers.slimDateTime,
                Invoice: invoices,
                Subcontractor: subcontractors,
            });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

module.exports = {
    renderIndex,
    renderDashboard,
};