const express = require('express');
const router = express.Router();
const Locations = require('../../models/location');
const logger = require('../../logger');
const path = require('path');
const helpers = require('../../helpers');

// Create a new location
const createLocation = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const {name, address, city, postalCode, country, latitude, longitude } = req.body;

        const newLocation = await Locations.create({
            name,
            address,
            city,
            postalCode,
            country,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
        });

        req.flash('success', 'Location created successfully.');
        res.redirect(`/dashboard/location`);
    } catch (error) {
        logger.error('Error creating location:', error.message);
        req.flash('error', 'Error creating location: ' + error.message);
        res.redirect('/location/create');
    }
};


// Read a specific location
const readLocation = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const location = await Locations.findByPk(req.params.id);

        if (!location) {
            req.flash('error', 'Location not found.');
            return res.redirect('/dashboard/location');
        }

        res.render(path.join('locations', 'viewLocation'), {
            title: 'View Location',
            location,
            slimDateTime: helpers.slimDateTime,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error viewing location: ' + error.message);
        req.flash('error', 'Error viewing location: ' + error.message);
        res.redirect('/dashboard/location');
    }
};

// Update an existing location
const updateLocation = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const { name, address, city, postalCode, country, latitude, longitude } = req.body;
        const locationId = req.params.locationId;

        const location = await Locations.findByPk(locationId);
        if (!location) {
            req.flash('error', 'Location not found.');
            return res.redirect('/dashboard/location');
        }

        location.name = name;
        location.address = address;
        location.city = city;
        location.postalCode = postalCode;
        location.country = country;
        location.latitude = parseFloat(latitude);
        location.longitude = parseFloat(longitude);

        await location.save();

        req.flash('success', 'Location updated successfully.');
        res.redirect(`/location/read/${location.id}`);
    } catch (error) {
        logger.error('Error updating location:', error.message);
        req.flash('error', 'Error updating location: ' + error.message);
        res.redirect(`/location/update/${req.params.locationId}`);
    }
};


// Delete a location
const deleteLocation = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const location = await Locations.findByPk(req.params.id);

        if (!location) {
            req.flash('error', 'Location not found.');
            return res.redirect('/dashboard/location');
        }

        await location.destroy();

        req.flash('success', 'Location deleted successfully.');
        res.redirect('/dashboard/location');
    } catch (error) {
        logger.error('Error deleting location: ' + error.message);
        req.flash('error', 'Error deleting location: ' + error.message);
        res.redirect('/dashboard/location');
    }
};

// Define routes
router.post('/location/create', createLocation);
router.get('/location/read/:id', readLocation);
router.post('/location/update/:id', updateLocation);
router.post('/location/delete/:id', deleteLocation);

module.exports = router;
