const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');
const packageJson = require('../../package.json');
const path = require('path');
const Quote = require('../../models/quote')
const Clients = require('../../models/client');
const Contacts = require('../../models/contact');

const renderQuoteCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        if (req.params.client) {
            const clients = await Clients.findByPk(req.params.client, {
                include: [Contacts]
            });
            if (!clients) {
                req.flash('error', 'Error: No Clients exist.');
                return res.redirect('/client/create');
            }
            return res.render(path.join('quotes', 'createQuote'), {
                clients,
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
            });
        } else {
            return res.status(404).send('Client not found');
        }
    } catch (error) {
        logger.error('Error rendering quote create form:' + error.message);
        req.flash('error', 'Error rendering quotes create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderQuoteUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
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

        logger.info(JSON.stringify(quote, null, 2));

        return res.render(path.join('quotes', 'updateQuote'), {
            quote,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
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