// controllers/quoteCRUD.js
const Quote = require('../models/quote');
const { validateQuoteData } = require('../helpers'); // Assume you have validation helpers similar to the Invoice example
const moment = require('moment');
const logger = require('../logger');

const createQuote = async (req, res) => {
    try {
        const validatedData = validateQuoteData(req.body);

        const newQuote = await Quote.create({
            date: validatedData.date,
            job_ref: validatedData.job_ref,
            site: validatedData.site,
            client: validatedData.client,
            contact_ref: validatedData.contact_ref,
            value: validatedData.value,
            desc: validatedData.desc,
            invoice_no: validatedData.invoice_no,
            invoice_date: validatedData.invoice_date,
            po_number: validatedData.po_number,
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
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
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
        res.status(500).json({ error: 'Error: ' + error.message });
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
        res.status(500).json({ error: 'Error: ' + error.message });
    }
};

const updateQuote = async (req, res) => {
    try {
        validateQuoteData(req.body);

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
        req.flash('error', 'Error: ' + error.message);
        const referer = req.get('referer') || '/';
        res.redirect(referer);
    }
};

module.exports = {
    createQuote,
    readQuote,
    readQuotes,
    updateQuote,
    deleteQuote,
};