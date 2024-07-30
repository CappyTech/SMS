// controllers/quoteCRUD.js
const express = require('express');
const router = express.Router();
const packageJson = require('../package.json');
const Quote = require('../models/quote');
const helpers = require('../helpers');
const moment = require('moment');
const logger = require('../logger');

const createQuote = async (req, res) => {
    try {
        const { date, job_ref, site, client, contact_ref, value, desc, invoice_no, invoice_date, po_number } = req.body;

        const newQuote = await Quote.create({
            date,
            job_ref,
            site,
            client,
            contact_ref,
            value,
            desc,
            invoice_no,
            invoice_date,
            po_number
        });

        res.redirect(`/quote/read/${newQuote.id}`);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errorMessages = error.errors.map((err) => err.message);
            logger.error(`Validation errors: ${errorMessages.join(', ')}`);
            return res.render('createQuote', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
            });
        }
        logger.error(`Error creating quote: ${error.message}`);
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

        const quote = await Quote.findByPk(req.params.id);

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.render('viewQuote', {
            quote,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            moment: moment,
        });
    } catch (error) {
        logger.error(`Error viewing quote: ${error.message}`);
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

        const quotes = await Quote.findAll({
            order: [['date', 'DESC']],
        });

        res.render('viewQuotes', {
            quotes,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            moment: moment,
        });
    } catch (error) {
        logger.error(`Error viewing quotes: ${error.message}`);
        req.flash('error', 'Error viewing quotes: ' + error.message);
        res.redirect('/dashboard/quote');
    }
};

const updateQuote = async (req, res) => {
    try {

        const quote = await Quote.findByPk(req.params.id);
        if (!quote) {
            throw new Error('Quote not found');
        }

        await Quote.update(req.body, { where: { id: req.params.id } });

        req.flash('success', 'Quote updated successfully');
        return res.redirect(`/quote/read/${req.params.id}`);
    } catch (error) {
        logger.error(`Error updating quote with ID: ${req.params.id}. Details: ${error.message}`);
        req.flash('error', `Error updating quote with ID: ${req.params.id}. Details: ${error.message}`);
        return res.redirect(`/quote/read/${req.params.id}`);
    }
};

const deleteQuote = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete quotes.');
        }

        const quote = await Quote.findByPk(req.params.id);

        if (!quote) {
            req.flash('error', 'Quote not found');
            return res.redirect(req.get('referer') || '/dashboard');
        }

        await quote.destroy();

        req.flash('success', 'Quote deleted successfully');
        const referer = req.get('referer') || '/dashboard';
        res.redirect(referer);
    } catch (error) {
        logger.error(`Error deleting quote: ${error.message}`);
        req.flash('error', 'Error deleting quote: ' + error.message);
        res.redirect('/dashboard/quote');
    }
};

router.post('/quote/create/', createQuote);
router.get('/quote/read/:id', readQuote);
router.get('/quotes', readQuotes);
router.post('/quote/update/:id', updateQuote);
router.post('/quote/delete/:id', deleteQuote);

module.exports = router;