const express = require('express');
const router = express.Router();
const path = require('path');
const authService = require('../services/authService');
const fetch = require('./fetchKashFlowData');
const logger = require('../services/loggerService');

let isFetching = false;

// Route for rendering the fetch status page
router.get('/kashflow', authService.ensureAuthenticated, authService.ensureRole('admin'), (req, res) => {
    res.render(path.join('kashflow', 'fetchStatus'), {
        title: 'Gathering KashFlow Data',
        isFetching,
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
    });
});

// Controller for initiating the data fetch process
router.get('/fetch-kashflow-data', authService.ensureAuthenticated, authService.ensureRole('admin'), async (req, res, next) => {
    if (isFetching) {
        return res.status(400).json({ message: 'Fetch is already in progress.' });
    }

    try {
        logger.info('Starting KashFlow data fetch...');
        isFetching = true;
        await fetch.fetchKashFlowData();
        res.status(200).json({ message: 'Fetch started.' });
    } catch (error) {
        logger.error('Error during data fetch:', error);
        isFetching = false;
        res.status(500).json({ message: 'Error starting data fetch.' });
    }
});

router.get('/fetch-status', authService.ensureAuthenticated, authService.ensureRole('admin'), (req, res) => {
    res.status(200).json({
        messages: fetchMessages,
        completed: !isFetching,
        error: fetchError || null,
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
    });
});

module.exports = router;

