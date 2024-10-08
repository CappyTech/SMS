const express = require('express');
const router = express.Router();
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const { formatCurrency, slimDateTime, rounding } = require('../helpers');
const logger = require('../services/loggerService'); 
const path = require('path');
const helpers = require('../helpers');

const renderYearlyReturns = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const { year, id } = req.params;

        if (!year || !id) {
            logger.warn("Year and Subcontractor ID are required.");
            return res.status(400).send("Year and Subcontractor ID are required.");
        }

        const monthNames = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

        // Fetch subcontractor data for the given year and ID
        const subcontractor = await Subcontractor.findOne({
            where: {
                id: id,
                deletedAt: null
            },
            include: {
                model: Invoice,
                as: 'invoices',
                where: {
                    year: year
                },
                order: [
                    ['month', 'ASC']
                ]
            }
        });

        if (!subcontractor) {
            logger.warn("Subcontractor not found.");
            return res.status(404).send("Subcontractor not found.");
        }

        // Extract invoices grouped by month
        const invoicesByMonth = {};
        subcontractor.invoices.forEach(invoice => {
            const month = invoice.month;
            if (!invoicesByMonth[month]) {
                invoicesByMonth[month] = [];
            }
            invoicesByMonth[month].push(invoice);
        });

        logger.info("Rendering yearly returns:", {
            subcontractor: subcontractor,
            year: year,
            invoicesByMonth: invoicesByMonth
        });

        res.render(path.join('monthlyreturns', 'yearlyReturns'), {
            title: 'Yearly Returns',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
            
            slimDateTime: slimDateTime,
            formatCurrency: formatCurrency,
            rounding: rounding,
            subcontractor: subcontractor,
            year: year,
            invoicesByMonth: invoicesByMonth,
            monthNames: monthNames
        });
    } catch (error) {
        logger.error("Error rendering yearly returns:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

router.get('/yearly/returns/:year/:id', helpers.ensureAuthenticated, renderYearlyReturns);

module.exports = router;
