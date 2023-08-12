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
    generateQRCode,
    submitEnable2FA,
} = require('../controllers/account');

// Account page
router.get('/account', getAccountPage);

// Account settings
router.get('/account/settings', getAccountSettingsPage);
router.post('/account/settings', updateAccountSettings);
router.get('/account/enable2fa', generateQRCode);
router.post('/account/enable2fa', submitEnable2FA);

const {
    renderFilteredMonthlyReturns,
    renderMonthlyReturnsForm,
    renderMonthlyReturns,
} = require('../controllers/monthlyReturns');

router.get('/monthly/returns', renderFilteredMonthlyReturns);
router.get('/monthly/returns/form', renderMonthlyReturnsForm);
router.get('/monthly/returns/:year/:subcontractor', renderMonthlyReturns);

module.exports = router;