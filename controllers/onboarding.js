// controllers/onboarding.js
const packageJson = require('../package.json');
const {
    Subcontractor
} = require('../models/subcontractor');

const renderOnboardingForm = (req, res) => {
    res.render('onboarding', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
        message: req.query.message || '',
    });
};

const submitOnboardingForm = async (req, res) => {
    try {
        const {
            cisNumber,
            utrNumber
        } = req.body;

        const sessionUser = await Subcontractor.findByPk(req.session.user.id);
        if (sessionUser) {
            sessionUser.cisNumber = cisNumber;
            sessionUser.utrNumber = utrNumber;
            sessionUser.onboarded = true;
            sessionUser.onboardedAt = new Date();
            await sessionUser.save();
            res.send('Onboarding completed');
        } else {
            res.status(404).send('Subcontractor not found');
        }
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

module.exports = {
    renderOnboardingForm,
    submitOnboardingForm
};