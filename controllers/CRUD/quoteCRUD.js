const express = require('express');
const router = express.Router();
const Quotes = require('../../models/quote');
const Clients = require('../../models/client');
const Contacts = require('../../models/contact');
const Jobs = require('../../models/job');
const helpers = require('../../helpers');
const moment = require('moment');
const logger = require('../../logger');
const path = require('path');

const createQuote = async (req, res) => {
    try {
        const { date, quote_ref, job_ref, location, contactId, value, desc, invoice_no, invoice_date } = req.body;
        logger.info(req.body);
        const clientId = req.params.client;

        if (!clientId) {
            req.flash('error', 'Client wasn\'t specified.');
            return res.redirect('/');
        } else {
            const newQuote = await Quotes.create({
                date: date,
                quote_ref: quote_ref,
                job_ref: job_ref,
                location: location,
                clientId: clientId,
                contactId: contactId, // Use contactId from the body
                value: value,
                desc: desc,
                invoice_no: invoice_no,
                invoice_date: invoice_date
            });
            req.flash('success', 'Quote created successfully');
            res.redirect(`/quote/read/${newQuote.id}`);
        }
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errorMessages = error.errors.map((err) => err.message);
            logger.error(`Validation errors: ${errorMessages.join(', ')}`);
        }
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

        const quote = await Quotes.findByPk(req.params.quote, {
            include: [{
                model: Clients,
                include: [Contacts]
            }]
        });

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        } else {
            res.render(path.join('quotes', 'viewQuote'), {
                title: 'Quote',
                quote,
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                moment: moment,
                slimDateTime: helpers.slimDateTime,
            });
        }
    } catch (error) {
        logger.error('Error viewing quote:' + error.message);
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
            return res.status(403).send('Access denied. Only admins can delete quotes.');
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

const convertToJob = async (req, res) => {
    try {
        // Fetch the quote by its ID
        const quote = await Quotes.findByPk(req.params.quoteId, {
            include: [Clients] // Include necessary associations if needed
        });

        // If the quote doesn't exist, return an error
        if (!quote) {
            req.flash('error', 'Quote not found');
            return res.redirect('/dashboard/quote');
        }

        // Create a new job using the relevant data from the quote
        const job = await Jobs.create({
            job_ref: `JOB-${quote.quote_ref}`, // Create a job reference based on the quote reference
            location: quote.location,
            clientId: quote.clientId,
            quoteId: quote.id, // Link this job to the original quote
            value: quote.value,
            desc: quote.desc,
            status: 'pending', // Default status of the job
        });

        // Mark the quote as accepted (optional)
        quote.isAccepted = true;
        await quote.save();

        // Redirect to the new job's page or another relevant page
        req.flash('success', 'Quote successfully converted to Job.');
        return res.redirect(`/job/read/${job.id}`);
    } catch (error) {
        logger.error('Error converting quote to job: ' + error.message);
        req.flash('error', 'Error converting quote to job: ' + error.message);
        return res.redirect('/dashboard/quote');
    };
};

router.post('/quote/create/:client', createQuote);
router.get('/quote/read/:quote', readQuote);
router.get('/quote/read/:client', readQuotes);
router.post('/quote/update/:id', updateQuote);
router.post('/quote/delete/:id', deleteQuote);
router.get('/quote/convert-to-job/:quoteId', convertToJob);

module.exports = router;
