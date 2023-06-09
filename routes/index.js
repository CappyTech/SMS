const express = require('express');
const router = express.Router();
const {
    renderIndex,
    renderDashboard
} = require('../controllers/index');

router.get('/', renderIndex);
router.get('/dashboard', renderDashboard);

// Import the necessary controllers
const {
    getAccountPage
} = require('../controllers/account');
const {
    getAccountSettingsPage,
    updateAccountSettings
} = require('../controllers/accountSettings');

// Account page
router.get('/account', getAccountPage);

// Account settings
router.get('/account/settings', getAccountSettingsPage);
router.post('/account/settings', updateAccountSettings);


module.exports = router;