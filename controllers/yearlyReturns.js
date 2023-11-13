// controllers/yearlyReturns.js
const packageJson = require('../package.json');
const {
    Op
} = require('sequelize');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const {
    formatCurrency,
    slimDateTime
} = require('../helpers');

const renderYearlyReturns = async (req, res) => {
    try {
        const {
            year,
            id
        } = req.params;

        if (!year || !id) {
            console.log("Year and Subcontractor ID are required."); // Add a log statement
            return res.status(400).send("Year and Subcontractor ID are required.");
        }


        const monthNames = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

        // Fetch subcontractor data for the given year and ID
        const subcontractor = await Subcontractor.findOne({
            where: {
                id: id,
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
            console.log("Subcontractor not found."); // Add a log statement
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

        console.log("Rendering yearly returns:", {
            subcontractor: subcontractor,
            year: year,
            invoicesByMonth: invoicesByMonth
        });

        res.render('yearlyReturns', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: slimDateTime,
            formatCurrency: formatCurrency,
            subcontractor: subcontractor,
            year: year,
            invoicesByMonth: invoicesByMonth,
            monthNames: monthNames
        });
    } catch (error) {
        console.error("Error rendering yearly returns:", error);
        res.status(500).send("Internal Server Error");
    }
};


module.exports = {
    renderYearlyReturns,
};