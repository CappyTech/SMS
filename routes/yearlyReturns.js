const express = require('express');
const router = express.Router();

const {
    renderYearlyReturns
} = require('../controllers/yearlyReturns');

router.get('/yearly/returns/:year/:id', renderYearlyReturns);

module.exports = router;