const express = require('express');
const router = express.Router();
const logger = require('../../logger');
const path = require('path');
const Locations = require('../../models/location');

// Render Location Creation Form
const renderLocationCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

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

// Render Location Update Form
const renderLocationUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const location = await Locations.findByPk(req.params.locationId);

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

// Define routes for rendering forms
router.get('/location/create', renderLocationCreateForm);
router.get('/location/update/:locationId', renderLocationUpdateForm);

module.exports = router;
