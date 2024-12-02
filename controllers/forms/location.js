const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');

const renderLocationCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        logger.info("Accessing /location/create");


        return res.render(path.join('locations', 'createLocation'), {
            title: 'Create Location',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering location create form: ' + error.message);
        req.flash('error', 'Error rendering location create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderLocationUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const location = await db.Locations.findByPk(req.params.locationId);

        if (!location) {
            req.flash('error', 'Location not found.');
            return res.redirect('/dashboard/location');
        }

        return res.render(path.join('locations', 'updateLocation'), {
            title: 'Update Location',
            location,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering location update form: ' + error.message);
        req.flash('error', 'Error rendering location update form: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/location/create', authService.ensureAuthenticated, authService.ensureRole('admin'), renderLocationCreateForm);
router.get('/location/update/:locationId', authService.ensureAuthenticated, authService.ensureRole('admin'), renderLocationUpdateForm);

module.exports = router;
