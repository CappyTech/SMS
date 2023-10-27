// controllers/monthlyReturns.js
const packageJson = require('../package.json');
const sequelize = require('sequelize');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const selectSubcontractorMonthlyReturns = async (req, res) => {
    try {
        console.log(req.session);
        let subcontractors;
        if (req.session.user.role === 'admin') {
            subcontractors = await Subcontractor.findAll({});
        } else {
            subcontractors = await Subcontractor.findAll({
                where: {
                    userId: req.session.user.id
                }
            });
        }

        if (subcontractors.length === 0) {
            return res.redirect('/subcontractor/create?message=No subcontractors exist, Or you don\'t have access to any Subcontractors.');
        }

        res.render('selectSubcontractorMonthlyReturns', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            subcontractors,
            message: req.query.message || '',
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

const renderMonthlyReturnsForm = async (req, res) => {
    try {
        // Fetch all subcontractors from the database
        const subcontractors = await Subcontractor.findAll({
            include: {
                model: Invoice,
                attributes: [
                    [sequelize.fn('YEAR', sequelize.col('remittanceDate')), 'year']
                ],
                group: [sequelize.fn('YEAR', sequelize.col('remittanceDate'))],
                order: [
                    [sequelize.fn('YEAR', sequelize.col('remittanceDate')), 'DESC']
                ]
            }
        });

        // Render the EJS view, passing in the subcontractors with their available years
        res.render('monthlyReturnsForm', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            subcontractors: subcontractors
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
                    remittanceDate: {
                        [Op.gte]: new Date(taxYear, 3, 5),
                        [Op.lt]: new Date(taxYear + 1, 3, 5)
                    }
                },
                order: [
                    ['remittanceDate', 'ASC']
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

module.exports = {
    renderFilteredMonthlyReturns,
    renderMonthlyReturnsForm,
};