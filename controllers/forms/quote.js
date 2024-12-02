const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');
const currencyService = require('../../services/currencyService');
const dateService = require('../../services/dateService');

const renderQuoteCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const clients = await db.Clients.findAll({
            include: [db.Contacts],
            order: [['createdAt', 'DESC']],
        });

        const locations = await db.Locations.findAll({
            order: [['createdAt', 'DESC']],
        });

        return res.render(path.join('quotes', 'createQuote'), {
            title: 'Create Quote',
            clients,
            locations,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering quote create form: ' + error.message);
        req.flash('error', 'Error rendering quotes create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderQuoteUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const quote = await db.Quote.findByPk(req.params.quote, {
            include: [{
                model: db.Clients,
                include: [db.Contacts]
            }]
        });

        if (!quote) {
            req.flash('error', 'Quote not found.');
            return res.redirect('/');
        }

        // Fetch all locations to populate the dropdown
        const locations = await db.Locations.findAll({
            order: [['createdAt', 'DESC']],
        });

        return res.render(path.join('quotes', 'updateQuote'), {
            title: 'Update Quote',
            quote,
            locations,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            slimDateTime: dateService.slimDateTime,
            formatCurrency: currencyService.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering quote update form:  ', error.message);
        req.flash('error', 'Error rendering quote update form: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/quote/create/', authService.ensureAuthenticated, authService.ensureRole('admin'), renderQuoteCreateForm);
router.get('/quote/update/:quote', authService.ensureAuthenticated, authService.ensureRole('admin'), renderQuoteUpdateForm);

module.exports = router;