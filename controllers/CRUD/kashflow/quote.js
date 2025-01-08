const express = require('express');
const router = express.Router();
const logger = require('../../../services/loggerService');
const path = require('path');
const db = require('../../../services/kashflowDatabaseService');
const authService = require('../../../services/authService');

const readQuote = async (req, res, next) => {
    try {
        const Quote = await db.KF_Quotes.findByPk(req.params.uuid);

        if (!Quote) {
            req.flash('error', 'Quote not found.');
            return res.redirect('/dashboard/KFquote');
        }
        Quote.Lines = typeof Quote.Lines === 'string' ? JSON.parse(Quote.Lines) : Quote.Lines || [];
        res.render(path.join('kashflow', 'viewQuote'), {
            title: 'Quote Overview',
            Quote,
        });
    } catch (error) {
        logger.error('Error reading kashflow Quote:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        next(error); // Pass the error to the error handler
    }
}

router.get('/kf/quote/read/:uuid', authService.ensureAuthenticated, authService.ensureRole('admin'), readQuote);

module.exports = router;