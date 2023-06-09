// routes/index.js
const express = require('express');
const router = express.Router();
const {
    renderIndex,
    renderDashboard
} = require('../controllers/index');

router.get('/', renderIndex);
router.get('/dashboard', renderDashboard);

const {
    getAccountPage,
    getAccountSettingsPage,
    updateAccountSettings,
    generateQRCode, // Add this line to import the enable2FA route handler
    submitEnable2FA, // Add this line to import the submitEnable2FA route handler
} = require('../controllers/account');

// Account page
router.get('/account', getAccountPage);

// Account settings
router.get('/account/settings', getAccountSettingsPage);
router.post('/account/settings', updateAccountSettings);
router.get('/account/enable2fa', generateQRCode);
router.post('/account/enable2fa', submitEnable2FA); // Add this line to handle the form submission for enabling 2FA

const {
    renderMonthlyReturns
} = require('../controllers/monthlyReturns');

router.get('/monthly/returns', renderMonthlyReturns);
module.exports = router;