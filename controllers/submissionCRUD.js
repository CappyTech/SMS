const express = require('express');
const router = express.Router();
const packageJson = require('../package.json');
const Submission = require('../models/submission');
const Invoice = require('../models/invoice');
const logger = require('../logger'); // Import the logger

// Create a new submission
const createSubmission = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const { selectedInvoices, submissionDate } = req.body;

        // Filter out empty submission dates
        const filteredSubmissionDates = submissionDate.filter(date => date.trim() !== '');

        // Check if selectedInvoices is provided
        if (!selectedInvoices || !selectedInvoices.length) {
            req.flash('error', 'No invoices selected.');
            return res.redirect('/submission/create');
        }

        // Retrieve the selected invoices from the database
        const invoices = await Invoice.findAll({
            where: {
                id: selectedInvoices
            }
        });

        // Check if all selected invoices have the same month and year
        const firstInvoice = invoices[0];
        const { month, year } = firstInvoice;

        for (const invoice of invoices) {
            if (invoice.month !== month || invoice.year !== year) {
                req.flash('error', 'All selected invoices must have the same month and year.');
                return res.redirect('/submission/create');
            }
        }

        // Initialize totals
        let totalGrossAmount = 0;
        let totalLabourCost = 0;
        let totalMaterialCost = 0;
        let totalCisAmount = 0;
        let totalNetAmount = 0;

        // Sum the values of the selected invoices
        invoices.forEach(invoice => {
            totalGrossAmount += invoice.grossAmount;
            totalLabourCost += invoice.labourCost;
            totalMaterialCost += invoice.materialCost;
            totalCisAmount += invoice.cisAmount;
            totalNetAmount += invoice.netAmount;
        });

        // Create the new submission with aggregated totals
        const newSubmission = await Submission.create({
            grossTotal: totalGrossAmount,
            labourTotal: totalLabourCost,
            materialTotal: totalMaterialCost,
            cisTotal: totalCisAmount,
            netTotal: totalNetAmount,
            month,
            year,
            submissionDate: filteredSubmissionDates[0]
        });

        res.redirect('/submission/' + newSubmission.id);
    } catch (error) {
        logger.error('Error creating submission:', error.message);
        res.status(500).send('Error creating submission');
    }
};

// View a specific submission
const viewSubmission = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        const submissionId = req.params.id;
        const submission = await Submission.findByPk(submissionId);
        if (!submission) {
            return res.status(404).send('Submission not found');
        }
        res.render('viewSubmission', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            submission
        });
    } catch (error) {
        logger.error('Error viewing submission:', error.message);
        res.status(500).send('Error viewing submission');
    }
};

// Display form to update a submission
const displayUpdateSubmissionForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        const submissionId = req.params.id;
        const submission = await Submission.findByPk(submissionId);
        res.render('updateSubmission', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            submission
        });
    } catch (error) {
        logger.error('Error displaying update form:', error.message);
        res.status(500).send('Error displaying update form');
    }
};

// Update a submission
const updateSubmission = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        const submissionId = req.params.id;
        const updatedSubmissionData = req.body;
        const submission = await Submission.findByPk(submissionId);
        await submission.update(updatedSubmissionData);
        res.redirect('/submission/' + submissionId);
    } catch (error) {
        logger.error('Error updating submission:', error.message);
        res.status(500).send('Error updating submission');
    }
};

// Delete a submission
const deleteSubmission = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        const submissionId = req.params.id;
        const submission = await Submission.findByPk(submissionId);
        await submission.destroy();
        res.redirect('/submissions'); // Redirect to a page listing all submissions
    } catch (error) {
        logger.error('Error deleting submission:', error.message);
        res.status(500).send('Error deleting submission');
    }
};

// View all submissions
const viewSubmissions = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        // Fetch all submissions
        const submissions = await Submission.findAll();

        res.render('viewSubmissions', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            submissions
        });
    } catch (error) {
        logger.error('Error viewing submissions:', error.message);
        res.status(500).send('Error viewing submissions');
    }
};

router.post('/submission', createSubmission);
router.get('/submission/:id', viewSubmission);
router.get('/submission/:id/edit', displayUpdateSubmissionForm);
router.post('/submission/:id', updateSubmission);
router.delete('/submission/:id', deleteSubmission);
router.get('/submissions', viewSubmissions);

module.exports = router;
