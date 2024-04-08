// /controllers/monthlyReturns.js

const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const {
    formatCurrency,
    slimDateTime
} = require('../helpers');

const renderMonthlyReturnsForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        // Define the monthNames array starting with April as month 1
        const monthNames = [
            'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December', 'January', 'February', 'March'
        ];

        // Fetch all subcontractors from the database
        const subcontractors = await Subcontractor.findAll({
            include: {
                model: Invoice,
                as: 'invoices',
                attributes: ['year', 'month'],
                group: ['year', 'month'],
                order: [
                    ['year', 'DESC'],
                    ['month', 'DESC']
                ]
            }
        });

        // Modify the subcontractors data to group invoices by year and extract unique months
        const subcontractorsWithMonths = subcontractors.map(subcontractor => {
            const invoicesByYear = {};
            subcontractor.invoices.forEach(invoice => {
                const year = invoice.year;
                const month = invoice.month;
                if (!invoicesByYear[year]) {
                    invoicesByYear[year] = [];
                }

                if (!invoicesByYear[year].includes(month)) {
                    invoicesByYear[year].push(month);
                    invoicesByYear[year].sort((a, b) => monthNames.indexOf(monthNames[a - 1]) - monthNames.indexOf(monthNames[b - 1]));
                }
            });

            return {
                subcontractor: subcontractor,
                years: Object.keys(invoicesByYear).sort((a, b) => b - a),
                invoicesByYear: invoicesByYear,
            };
        });

        // Render the EJS view, passing in the modified subcontractors data
        res.render('monthlyReturnsForm', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: slimDateTime,
            formatCurrency: formatCurrency,
            subcontractorsWithMonths: subcontractorsWithMonths,
            monthNames: monthNames
        });
    } catch (error) {
        console.error("Error rendering the form:", error);
        req.flash('error', 'Error: Unable to render monthly returns');
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

const renderMonthlyReturnsForOneSubcontactor = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        const {
            month,
            year,
            id
        } = req.params;

        if (!month || !year || !id) {
            console.log("Month, Year, and Subcontractor are required.");
            return res.status(400).send("Month, Year, and Subcontractor are required.");
        }

        const monthNames = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

        const subcontractor = await Subcontractor.findAll({
            where: {
                id: id,
                deletedAt: null
            },
            include: {
                model: Invoice,
                as: 'invoices',
                where: {
                    month: month
                }
            }
        });

        console.log("Rendering monthly returns:", {
            subcontractor: subcontractor,
            month: month,
            year: year
        });

        res.render('monthlyReturnsForOneSubcontractor', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: slimDateTime,
            formatCurrency: formatCurrency,
            month: month,
            year: year,
            subcontractor: subcontractor[0],
            invoices: subcontractor[0].invoices,
            monthNames: monthNames
        });
    } catch (error) {
        console.error("Error rendering monthly returns:", error);
        req.flash('error', 'Error: Unable to render monthly returns');
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

const renderMonthlyReturnsForAll = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        const {
            month,
            year
        } = req.params;

        if (!month || !year) {
            console.log("Month and Year are required.");
            return res.status(400).send("Month and Year are required.");
        }

        const monthNames = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

        const subcontractors = await Subcontractor.findAll({
            where: {
                deletedAt: null
            },
            include: {
                model: Invoice,
                as: 'invoices',
                where: {
                    month: month
                }
            }
        });

        console.log("Rendering monthly returns:", {
            subcontractors: subcontractors,
            month: month,
            year: year
        });

        res.render('monthlyReturnsForAll', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: slimDateTime,
            formatCurrency: formatCurrency,
            month: month,
            year: year,
            subcontractors: subcontractors,
            monthNames: monthNames
        });
    } catch (error) {
        console.error("Error rendering monthly returns:", error);
        req.flash('error', 'Error: Unable to render monthly returns');
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

router.get('/monthly/returns/form', renderMonthlyReturnsForm);
router.get('/monthly/returns/:year/:month', renderMonthlyReturnsForAll);
router.get('/monthly/returns/:month/:year/:id', renderMonthlyReturnsForOneSubcontactor);

module.exports = router;