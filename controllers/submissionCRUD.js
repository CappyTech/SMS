// /controllers/submissionCRUD.js

const express = require('express');
const router = express.Router();
const packageJson = require('../package.json');
const Submission = require('../models/submission');

// Create a new submission
const createSubmission = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        const submissionData = req.body; // Assuming form data is sent via POST request
        const newSubmission = await Submission.create(submissionData);
        res.redirect('/submissions/' + newSubmission.id); // Redirect to view the newly created submission
    } catch (error) {
        console.error('Error creating submission:', error);
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
            packageJson, submission
        });
    } catch (error) {
        console.error('Error viewing submission:', error);
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
        console.error('Error displaying update form:', error);
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
        res.redirect('/submissions/' + submissionId);
    } catch (error) {
        console.error('Error updating submission:', error);
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
        console.error('Error deleting submission:', error);
        res.status(500).send('Error deleting submission');
    }
};

router.post('/submissions', createSubmission);
router.get('/submissions/:id', viewSubmission);
router.get('/submissions/:id/edit', displayUpdateSubmissionForm);
router.put('/submissions/:id', updateSubmission);
router.delete('/submissions/:id', deleteSubmission);

module.exports = router;