// controllers/monthlyReturns.js
const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const renderMonthlyReturnsForm = async (req, res) => {
    try {
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
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
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

const renderMonthlyReturns = async (req, res) => {
    try {
        const {
            month,
            year,
            subcontractor
        } = req.params;

        if (!month || !year || !subcontractor) {
            return res.status(400).send("Month, Year, and Subcontractor are required.");
        }

        const subcontractors = await Subcontractor.findAll({
            where: {
                id: subcontractor,
                deletedAt: null
            },
            include: {
                model: Invoice,
                as: 'invoices',
                where: {
                    month: month,
                    year: year
                }
            }
        });

        // Log the data for debugging
        console.log('Subcontractors Data:', JSON.stringify(subcontractors, null, 2));

        if (subcontractors.length === 0 || subcontractors[0].invoices.length === 0) {
            return res.render('monthlyReturns', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                month: month,
                year: year,
                subcontractor: subcontractors[0] || null,
                invoices: [],
                slimDateTime: helpers.slimDateTime,
                formatCurrency: helpers.formatCurrency,
            });
        }

        res.render('monthlyReturns', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            month: month,
            year: year,
            subcontractor: subcontractors[0],
            invoices: subcontractors[0].invoices,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency
        });
    } catch (error) {
        console.error("Error rendering monthly returns:", error);
        req.flash('error', 'Error: Unable to render monthly returns');
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};


module.exports = {
    renderMonthlyReturnsForm,
    renderMonthlyReturns,
};