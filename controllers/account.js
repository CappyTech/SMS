const User = require('../models/user');
const helpers = require('../helpers');
const packageJson = require('../package.json');

// Display the account page
const getAccountPage = async (req, res) => {
    try {
        // Fetch the user data based on the current user's session
        const user = await User.findOne({
            where: {
                id: req.session.user.id
            }
        });

        res.render('account', {
            user,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            message: req.query.message || '',
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

module.exports = {
    getAccountPage,
};