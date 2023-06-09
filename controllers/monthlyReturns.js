// controllers/monthlyReturns.js
const packageJson = require('../package.json');
const Sequelize = require('sequelize');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const renderMonthlyReturns = async (req, res) => {
    try {
        // Retrieve monthly returns for each subcontractor
        const monthlyReturns = await Invoice.findAll({
            attributes: [
                [Sequelize.fn('MONTH', Sequelize.col('invoiceDate')), 'month'],
                [Sequelize.fn('YEAR', Sequelize.col('invoiceDate')), 'year'],
                [Sequelize.literal('`Subcontractor`.`name`'), 'subcontractorName'],
                [Sequelize.fn('SUM', Sequelize.col('netAmount')), 'totalnetAmount'],
                [Sequelize.fn('SUM', Sequelize.col('grossAmount')), 'totalgrossAmount'],
                [Sequelize.fn('SUM', Sequelize.col('labourCost')), 'totallabourCost'],
                [Sequelize.fn('SUM', Sequelize.col('materialCost')), 'totalmaterialCost'],
                [Sequelize.fn('SUM', Sequelize.col('cisAmount')), 'totalcisAmount'],
                [Sequelize.fn('SUM', Sequelize.col('reverseCharge')), 'totalreverseCharge'],
            ],
            include: [{
                model: Subcontractor,
                attributes: [],
            }, ],
            group: ['year', 'month', 'subcontractorName'],
            order: ['year', 'month', 'subcontractorName'],
            raw: true,
        });


        // Render the monthly returns page
        res.render('monthlyReturns', {
            monthlyReturns,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            message: req.query.message || '',
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        console.error('Error retrieving monthly returns:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    renderMonthlyReturns
};