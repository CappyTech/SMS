const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');
const path = require('path');

const Quote = require('../../models/quote')
const Clients = require('../../models/client');
const Contacts = require('../../models/contact');
const Locations = require('../../models/location');

const renderQuoteCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const clients = await Clients.findAll({
            include: [Contacts],
            order: [['createdAt', 'DESC']],
        });

        const locations = await Locations.findAll({
            order: [['createdAt', 'DESC']],
        });

        return res.render(path.join('quotes', 'createQuote'), {
            title: 'Create Quote',
            clients,  // Pass clients to the form
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

        const quote = await Quote.findByPk(req.params.quote, {
            include: [{
                model: Clients,
                include: [Contacts]
            }]
        });

        if (!quote) {
            return res.status(404).send('Quote not found');
        }

        // Fetch all locations to populate the dropdown
        const locations = await Locations.findAll({
            order: [['createdAt', 'DESC']],
        });

        return res.render(path.join('quotes', 'updateQuote'), {
            title: 'Update Quote',
            quote,
            locations,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering quote update form:  ', error.message);
        req.flash('error', 'Error rendering quote update form: ' + error.message);
        return res.redirect('/');
    }
};


router.get('/quote/create/:client', renderQuoteCreateForm);
router.get('/quote/update/:quote', renderQuoteUpdateForm);

module.exports = router;