const express = require('express');
const router = express.Router();

const {
    renderMonthlyReturnsForm,
    renderMonthlyReturns,
} = require('../controllers/monthlyReturns');

router.get('/monthly/returns/form', renderMonthlyReturnsForm);
router.get('/monthly/returns/:month/:year/:subcontractor', renderMonthlyReturns);

module.exports = router;