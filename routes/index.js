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
    updateAccountSettings,
} = require('../controllers/account');

// Account page
router.get('/account', getAccountPage);

// Account settings
router.post('/account/settings', updateAccountSettings);

module.exports = router;