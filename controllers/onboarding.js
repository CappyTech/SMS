// controllers/onboarding.js
const packageJson = require('../package.json');
const {
    User
} = require('../models/user');
const {
    Subcontractor
} = require('../models/subcontractor');

const renderOnboardingForm = async (req, res) => {
    try {
        console.log(req.session);
        const sessionUser = await User.findByPk(req.session.user.id);
        res.render('onboarding', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            message: req.query.message || '',
            sessionUser,
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

const submitOnboardingForm = async (req, res) => {
    try {
        const {
            cisNumber,
            utrNumber
        } = req.body;

        const sessionUser = await Subcontractor.findByPk({
            where: {
                UserId: req.session.user.id
            }
        });
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
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

module.exports = {
    renderOnboardingForm,
    submitOnboardingForm
};