const express = require('express');
const router = express.Router();
const Quotes = require('../../models/quote');
const Clients = require('../../models/client');
const Jobs = require('../../models/job');
const Locations = require('../../models/location');
const helpers = require('../../helpers');
const moment = require('moment');
const logger = require('../../logger');
const path = require('path');

const createJob = async (req, res) => {
    try {
        const quote = await Quotes.findByPk(req.params.quoteId, {
            include: [Clients]
        });

        if (!quote) {
            req.flash('error', 'Quote not found');
            return res.redirect('/dashboard/quote');
        }

        const job = await Jobs.create({
            job_ref: `JOB-${quote.quote_ref}`,
            locationId: quote.locationId,  // Ensure location is from Locations table
            clientId: quote.clientId,
            quoteId: quote.id,
            value: quote.value,
            desc: quote.desc,
            status: 'pending',
        });

        quote.isAccepted = true;
        await quote.save();

        req.flash('success', 'Quote successfully converted to Job.');
        return res.redirect(`/job/read/${job.id}`);
    } catch (error) {
        logger.error('Error converting quote to job: ' + error.message);
        req.flash('error', 'Error converting quote to job: ' + error.message);
        return res.redirect('/dashboard/quote');
    }
};

const readJob = async (req, res) => {
    try {
        const job = await Jobs.findByPk(req.params.jobId, {
            include: [Clients, Quotes, Locations]
        });

        if (!job) {
            req.flash('error', 'Job not found');
            return res.redirect('/dashboard/job');
        }

        res.render(path.join('jobs', 'viewJob'), {
            title: 'Job',
            job,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            moment: moment,
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        logger.error('Error reading job: ' + error.message);
        req.flash('error', 'Error reading job: ' + error.message);
        return res.redirect('/dashboard/job');
    }
};

const updateJob = async (req, res) => {
    try {
        const job = await Jobs.findByPk(req.params.jobId);

        if (!job) {
            req.flash('error', 'Job not found');
            return res.redirect('/dashboard/job');
        }

        await Jobs.update(req.body, { where: { id: req.params.jobId } });

        req.flash('success', 'Job updated successfully');
        return res.redirect(`/job/read/${req.params.jobId}`);
    } catch (error) {
        logger.error('Error updating job: ' + error.message);
        req.flash('error', 'Error updating job: ' + error.message);
        return res.redirect(`/job/read/${req.params.jobId}`);
    }
};

const deleteJob = async (req, res) => {
    try {
        const job = await Jobs.findByPk(req.params.jobId);

        if (!job) {
            req.flash('error', 'Job not found');
            return res.redirect('/dashboard/job');
        }

        await job.destroy();

        req.flash('success', 'Job deleted successfully');
        return res.redirect('/dashboard/job');
    } catch (error) {
        logger.error('Error deleting job: ' + error.message);
        req.flash('error', 'Error deleting job: ' + error.message);
        return res.redirect('/dashboard/job');
    }
};

router.post('/job/create/:quoteId', createJob);
router.get('/job/read/:jobId', readJob);
router.post('/job/update/:jobId', updateJob);
router.post('/job/delete/:jobId', deleteJob);

module.exports = router;
