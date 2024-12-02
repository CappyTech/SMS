const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');

const renderJobCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const clients = await db.Clients.findAll({
            include: [db.Quotes],
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

const renderJobUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const job = await db.Jobs.findByPk(req.params.jobId, {
            include: [db.Clients, db.Locations, db.Quotes],
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

router.get('/job/create', authService.ensureAuthenticated, authService.ensureRole('admin'), renderJobCreateForm);
router.get('/job/update/:jobId', authService.ensureAuthenticated, authService.ensureRole('admin'), renderJobUpdateForm);

module.exports = router;
