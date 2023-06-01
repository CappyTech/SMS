const packageJson = require('../package.json');

const renderIndex = (req, res) => {
    res.render('index', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson
    });
};

const renderDashboard = (req, res) => {
    if (req.session.user) {
        res.render('dashboard', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson
        });
    } else {
        res.redirect('/login');
    }
};

module.exports = {
    renderIndex,
    renderDashboard,
};