const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const logger = require('../logger');

const renderIndex = (req, res) => {
    res.render('index', {
        title: 'Home',
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
    });
};

router.get('/admin/onedrive-sync', async (req, res) => {
    try {
        logger.info('Manual trigger: Running OneDrive sync...');
        await helpers.syncOneDriveToDatabase();
        res.send('OneDrive sync completed successfully.');
    } catch (error) {
        logger.error('Error during OneDrive sync: ' + error.message);
        res.status(500).send('Error during OneDrive sync.');
    }
});

router.get('/', renderIndex);

module.exports = router;
