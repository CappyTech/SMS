// controllers/monthlyReturns.js
const packageJson = require('../package.json');
const {
    Op
} = require('sequelize');
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
        res.status(500).send('Failed to render the form.');
    }
};



const renderFilteredMonthlyReturns = async (req, res) => {
    const taxYear = parseInt(req.query.taxYear || new Date().getFullYear());

    try {
        const subcontractors = await Subcontractor.findAll({
            include: {
                model: Invoice,
                where: {
                    [Op.or]: [{
                            year: taxYear,
                            month: {
                                [Op.gte]: 1
                            }
                        }, // From April of the taxYear
                        {
                            year: taxYear + 1,
                            month: {
                                [Op.lte]: 3
                            }
                        } // To March of the next year
                    ]
                },
                order: [
                    ['year', 'ASC'],
                    ['month', 'ASC']
                ]
            }
        });

        const reports = subcontractors.map(subcontractor => {
            const monthlyData = Array(12).fill(0).map((_, index) => {
                const monthStart = new Date(taxYear, index + 3, 5);
                const monthEnd = new Date(taxYear, index + 4, 5);
                if (index === 11) monthEnd.setFullYear(taxYear + 1);

                const monthlyInvoices = subcontractor.invoices.filter(invoice =>
                    invoice.remittanceDate >= monthStart && invoice.remittanceDate < monthEnd
                );

                const totalGrossAmount = monthlyInvoices.reduce((sum, invoice) => sum + invoice.grossAmount, 0);
                const totalLabourCost = monthlyInvoices.reduce((sum, invoice) => sum + invoice.labourCost, 0);
                const totalMaterialCost = monthlyInvoices.reduce((sum, invoice) => sum + invoice.materialCost, 0);
                const totalCisAmount = monthlyInvoices.reduce((sum, invoice) => sum + invoice.cisAmount, 0);
                const totalNetAmount = monthlyInvoices.reduce((sum, invoice) => sum + invoice.netAmount, 0);
                const totalReverseCharge = monthlyInvoices.reduce((sum, invoice) => sum + (invoice.reverseCharge || 0), 0);

                return {
                    month: monthStart.getMonth(),
                    totalGrossAmount,
                    totalLabourCost,
                    totalMaterialCost,
                    totalCisAmount,
                    totalNetAmount,
                    totalReverseCharge,
                    invoices: monthlyInvoices
                };
            });

            return {
                subcontractor: subcontractor.name,
                monthlyData
            };
        });

        res.json(reports);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to generate the report.'
        });
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
            return res.render('monthReturns', {
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

        res.render('monthReturns', {
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
        console.error("Error rendering the filtered monthly returns:", error);
        res.status(500).send("Internal Server Error");
    }
};


module.exports = {
    renderFilteredMonthlyReturns,
    renderMonthlyReturnsForm,
    renderMonthlyReturns,
};