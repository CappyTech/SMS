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

const {
    renderFilteredMonthlyReturns,
    renderMonthlyReturnsForm,
    renderMonthlyReturns,
} = require('../controllers/monthlyReturns');

router.get('/monthly/returns', renderFilteredMonthlyReturns);
router.get('/monthly/returns/form', renderMonthlyReturnsForm);
router.get('/monthly/returns/:month/:year/:subcontractor', renderMonthlyReturns);

const {
    renderYearlyReturns
} = require('../controllers/yearlyReturns');

router.get('/yearly/returns/:year/:id', renderYearlyReturns);
module.exports = router;