// controllers/index.js

const packageJson = require('../package.json');
const User = require('../models/user');
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
        console.log(req.session);
        if (req.session.user) {
            const users = await User.findAll({
                where: {
                    id: req.session.user.id,
                },
            });

            const subcontractors = await Subcontractor.findAll({
                where: {
                    userId: req.session.user.id,
                },
            });

            if (subcontractors.length > 0) {
                const subcontractorId = subcontractors[0].id; // Retrieve the correct subcontractorId
                const invoices = await Invoice.findAll({
                    where: {
                        subcontractorId: subcontractorId,
                    },
                });

                const userCount = await User.count({
                    where: {
                        id: req.session.user.id,
                    },
                });

                const subcontractorCount = await Subcontractor.count({
                    where: {
                        userId: req.session.user.id,
                    },
                });

                const invoiceCount = await Invoice.count({
                    where: {
                        subcontractorId: subcontractorId,
                    },
                });

                res.render('dashboard', {
                    userCount,
                    subcontractorCount,
                    invoiceCount,
                    users,
                    subcontractors,
                    invoices,
                    errorMessages: req.flash('error'),
                    successMessage: req.flash('success'),
                    session: req.session,
                    packageJson,
                    slimDateTime: helpers.slimDateTime,
                    message: req.query.message || '',
                });
            } else {
                res.redirect('/subcontractor/create');
            }
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

module.exports = {
    renderIndex,
    renderDashboard,
};