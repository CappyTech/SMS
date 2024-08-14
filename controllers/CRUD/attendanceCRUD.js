const express = require('express');
const router = express.Router();
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
} = require('../../helpers');
const moment = require('moment');
const logger = require('../../logger'); 
const { Attendance } = require('../../models/attendance');