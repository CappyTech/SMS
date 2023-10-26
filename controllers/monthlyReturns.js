// controllers/monthlyReturns.js
const packageJson = require('../package.json');
const Sequelize = require('sequelize');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

/*
const renderMonthlyReturns = async (req, res) => {
    try {
        // Retrieve available tax years
        const taxYears = await Invoice.findAll({
            attributes: [
                [Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY'))), 'year'],
            ],
            group: ['year'],
            order: ['year'],
            raw: true,
        });

        // Retrieve selected tax year from query parameter or default to the first available year
        const selectedYear = req.query.taxYearFilter || (taxYears.length > 0 ? taxYears[0].year : null);

        // Retrieve monthly returns for each subcontractor based on the selected tax year
        const monthlyReturns = await Invoice.findAll({
            attributes: [
                [Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY'))), 'year'],
                [Sequelize.literal("CASE WHEN MONTH(submissionDate) >= 4 THEN MONTH(submissionDate) - 3 ELSE MONTH(submissionDate) + 9 END"), 'month'],
                [Sequelize.literal('`Subcontractor`.`name`'), 'subcontractorName'],
                [Sequelize.fn('SUM', Sequelize.col('netAmount')), 'totalnetAmount'],
                // ... other attributes ...
            ],
            include: [{
                model: Subcontractor,
                attributes: [],
            }],
            where: Sequelize.and(
                Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY'))), selectedYear
            ),
            group: ['year', 'month', 'subcontractorName'],
            order: ['year', 'month', 'subcontractorName'],
            raw: true,
        });

        // Render the monthly returns page with the tax years and selected year
        res.render('monthlyReturns', {
            monthlyReturns,
            taxYears: taxYears.map(entry => entry.year),
            selectedYear,
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
*/

const renderMonthlyReturns = async (req, res) => {
    try {
        const {
            year,
            subcontractor
        } = req.params;

        // Retrieve monthly returns for the specified year and subcontractor
        const monthlyReturns = await Invoice.findAll({
            attributes: [
                [Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY'))), 'year'],
                [Sequelize.literal("CASE WHEN MONTH(submissionDate) >= 4 THEN MONTH(submissionDate) - 3 ELSE MONTH(submissionDate) + 9 END"), 'month'],
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
            }],
            where: Sequelize.and(
                Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY'))), year,
                Sequelize.where(Sequelize.col('SubcontractorId'), subcontractor)
            ),
            group: ['year', 'month', 'subcontractorName'],
            order: ['year', 'month', 'subcontractorName'],
            raw: true,
        });

        // Render the monthly returns page with the filtered data
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
        console.error('Error retrieving filtered monthly returns:', error);
        res.status(500).send('Internal Server Error');
    }
};


const renderMonthlyReturnsForm = async (req, res) => {
    try {
        // Retrieve available subcontractors for populating the dropdown
        const subcontractors = await Subcontractor.findAll({
            attributes: ['id', 'name'],
            order: ['name'],
            raw: true,
        });

        // Retrieve available tax years
        const taxYears = await Invoice.findAll({
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY')))), 'year'],
            ],
            raw: true,
        });

        // Map the result to get an array of years
        const availableYears = taxYears.map(entry => entry.year);

        // Render the monthly returns form page with the list of subcontractors
        res.render('monthlyReturnsForm', {
            subcontractors,
            taxYears: availableYears,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            message: req.query.message || '',
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        console.error('Error rendering monthly returns form:', error);
        res.status(500).send('Internal Server Error');
    }
};


const renderFilteredMonthlyReturns = async (req, res) => {
    try {
        const {
            year,
            subcontractor
        } = req.query;

        console.log(subcontractor);
        console.log(year);

        // Retrieve available tax years
        const taxYears = await Invoice.findAll({
            attributes: [
                [Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY'))), 'year'],
            ],
            group: ['year'],
            order: ['year'],
            raw: true,
        });

        const yearColumn = Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY')));

        const selectedYear = year || (taxYears.length > 0 ? taxYears[0].year : null);

        // Build the conditions for the query
        const whereConditions = {
            '$Invoice.deletedAt$': null,
            '$SubcontractorId$': subcontractor,
            [yearColumn]: selectedYear,
        };

        // Retrieve monthly returns for each subcontractor based on the selected tax year and subcontractor
        const monthlyReturns = await Invoice.findAll({
            attributes: [
                [Sequelize.fn('YEAR', Sequelize.fn('DATE_ADD', Sequelize.col('submissionDate'), Sequelize.literal('INTERVAL 5 DAY'))), 'year'],
                [Sequelize.literal("CASE WHEN MONTH(submissionDate) >= 4 THEN MONTH(submissionDate) - 3 ELSE MONTH(submissionDate) + 9 END"), 'month'],
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
            }],
            where: whereConditions,
            group: ['year', 'month', 'subcontractorName'],
            order: ['year', 'month', 'subcontractorName'],
            raw: true,
        });

        // Render the monthly returns page with the tax years, selected year, and filtered data
        res.render('monthlyReturns', {
            monthlyReturns,
            taxYears: taxYears.map(entry => entry.year),
            selectedYear,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            message: req.query.message || '',
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        console.error('Error retrieving filtered monthly returns:', error);
        res.status(500).send('Internal Server Error');
    }
};



module.exports = {
    renderFilteredMonthlyReturns,
    renderMonthlyReturns,
    renderMonthlyReturnsForm,
};