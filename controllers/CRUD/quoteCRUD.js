const express = require('express');
const router = express.Router();
const Quotes = require('../../models/quote');
const Clients = require('../../models/client');
const Contacts = require('../../models/contact');
const Locations = require('../../models/location');
const Jobs = require('../../models/job');
const helpers = require('../../helpers');
const moment = require('moment');
const logger = require('../../logger');
const path = require('path');

const createQuote = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const { date, quote_ref, job_ref, locationId, clientId, contactId, value, desc, invoice_no, invoice_date } = req.body;
        logger.info(req.body);

        if (!clientId) {
            req.flash('error', 'Client wasn\'t specified.');
            return res.redirect('/quote/create');
        }

        if (!locationId) {
            req.flash('error', 'Location wasn\'t specified.');
            return res.redirect('/quote/create');
        }

        const locationExists = await Locations.findByPk(locationId);
        if (!locationExists) {
            req.flash('error', 'Selected location does not exist.');
            return res.redirect('/quote/create');
        }

        const newQuote = await Quotes.create({
            date: date,
            quote_ref: quote_ref,
            job_ref: job_ref,
            locationId: locationId,
            clientId: clientId,
            contactId: contactId,
            value: value,
            desc: desc,
            invoice_no: invoice_no,
            invoice_date: invoice_date
        });

        req.flash('success', 'Quote created successfully');
        res.redirect(`/quote/read/${newQuote.id}`);
    } catch (error) {
        logger.error('Error creating quote:' + error.message);
        req.flash('error', 'Error creating quote: ' + error.message);
        res.redirect('/dashboard/quote');
    }
};



const readQuote = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const quote = await Quotes.findByPk(req.params.quoteId, {
            include: [
                {
                    model: Locations
                },
                {
                    model: Clients,
                    include: [Contacts] // Assuming Contacts are associated with Clients
                }
            ]
        });

        if (!quote) {
            req.flash('error', 'Quote not found.');
            return res.redirect('/dashboard/quote');
        }

        res.render(path.join('quotes', 'viewQuote'), {
            title: 'Quote Details',
            quote,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            moment: moment,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        logger.error('Error viewing quote: ' + error.message);
        req.flash('error', 'Error viewing quote: ' + error.message);
        res.redirect('/dashboard/quote');
    }
};


const readQuotes = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const quotes = await Quotes.findAll({
            where: { clientId: req.params.client },
            order: [['date', 'DESC']],
            include: [Clients]
        });

        res.render(path.join('quotes', 'viewQuotes'), {
            title: 'Quotes',
            quotes,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            moment: moment,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        logger.error('Error viewing quotes:' + error.message);
        req.flash('error', 'Error viewing quotes: ' + error.message);
        res.redirect('/dashboard/quote');
    }
};

const updateQuote = async (req, res) => {
    try {
        const quote = await Quotes.findByPk(req.params.id);
        if (!quote) {
            throw new Error('Quote not found');
        }

        await Quotes.update(req.body, { where: { id: req.params.id } });

        req.flash('success', 'Quote updated successfully');
        return res.redirect(`/quote/read/${req.params.id}`);
    } catch (error) {
        logger.error(`Error updating quote with ID: ${req.params.id}. Details:` + error.message);
        req.flash('error', `Error updating quote with ID: ${req.params.id}. Details:` + error.message);
        return res.redirect(`/quote/read/${req.params.id}`);
    }
};

const deleteQuote = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const quote = await Quotes.findByPk(req.params.id);

        if (!quote) {
            req.flash('error', 'Quote not found');
            return res.redirect('/dashboard/quote');
        }

        await quote.destroy();

        req.flash('success', 'Quote deleted successfully');
        res.redirect('/dashboard/quote');
    } catch (error) {
        logger.error('Error deleting quote: ' + error.message);
        req.flash('error', 'Error deleting quote: ' + error.message);
        res.redirect('/dashboard/quote');
    }
};

router.get('/fetch/quote/:quoteId', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const quotes = await Quotes.findAll({
            where: { id: req.params.quoteId },
            order: [['createdAt', 'ASC']],
        });

        res.json({ quotes });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
});


router.post('/quote/create/:client', createQuote);
router.get('/quote/read/:quoteId', readQuote);
router.get('/quote/read/:client', readQuotes);
router.post('/quote/update/:id', updateQuote);
router.post('/quote/delete/:id', deleteQuote);

module.exports = router;
