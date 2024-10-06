const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../services/loggerService');
const path = require('path');

const Jobs = require('../../models/job');
const Clients = require('../../models/client');
const Quotes = require('../../models/quote');
const Locations = require('../../models/location');

// Render Job Creation Form
const renderJobCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const clients = await Clients.findAll({
            include: [Quotes],
            order: [['createdAt', 'DESC']],
        });

        if (!clients || clients.length === 0) {
            req.flash('error', 'Error: No Clients exist.');
            return res.redirect('/client/create');
        }

        const locations = await Locations.findAll({
            order: [['createdAt', 'DESC']],
        });

        return res.render(path.join('jobs', 'createJob'), {
            title: 'Create Job',
            clients,
            locations,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering job create form: ' + error.message);
        req.flash('error', 'Error rendering job create form: ' + error.message);
        return res.redirect('/');
    }
};

// Render Job Update Form
const renderJobUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const job = await Jobs.findByPk(req.params.jobId, {
            include: [Clients, Locations, Quotes],
        });

        if (!job) {
            req.flash('error', 'Job not found.');
            return res.redirect('/dashboard/job');
        }

        res.render(path.join('jobs', 'updateJob'), {
            title: 'Update Job',
            job,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        req.flash('error', 'Error loading the job update form: ' + error.message);
        return res.redirect('/dashboard/job');
    }
};

// Define routes for rendering forms
router.get('/job/create', helpers.ensureAuthenticated, renderJobCreateForm);
router.get('/job/update/:jobId', helpers.ensureAuthenticated, renderJobUpdateForm);

module.exports = router;
