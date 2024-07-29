const express = require('express');
const router = express.Router();
const packageJson = require('../package.json');
const { 
    slimDateTime, 
    formatCurrency, 
    isAdmin, 
    validateInvoiceData, 
    calculateInvoiceAmounts, 
    rounding, 
    getCurrentTaxYear, 
    getTaxYearStartEnd, 
    getCurrentMonthlyReturn 
} = require('../helpers');
const moment = require('moment');
const logger = require('../logger'); // Import the logger
const { Attendance } = require('../models/attendance');