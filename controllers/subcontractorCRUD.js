// /controllers/subcontractorCRUD.js

const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');
const {
    Op
} = require('sequelize');

const createSubcontractor = async (req, res) => {
    try {

        const {
            name,
            company,
            line1,
            line2,
            city,
            county,
            postalCode,
            cisNumber,
            utrNumber,
            isGross
        } = req.body;

        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        // Check if the subcontractor already exists by username or email
        const existingSubcontractor = await Subcontractor.findOne({
            where: {
                [Op.or]: [{
                    name
                }, {
                    company
                }, {
                    utrNumber
                }, {
                    cisNumber
                }],
            },
        });

        if (existingSubcontractor) {
            req.flash('error', 'User with the same username or email already exists.');
            return res.redirect('/admin'); // Redirect to the appropriate page
        }

        if (!name || !company || !line1 || !city || !county || !postalCode || !cisNumber || !utrNumber) {
            return res.status(400).send('Incomplete form data');
        }


        await Subcontractor.create({
            name,
            company,
            line1,
            line2,
            city,
            county,
            postalCode,
            cisNumber,
            utrNumber,
            isGross
        });

        req.flash('success', 'Subcontractor created.');
        const referrer = '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error creating subcontractor: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};
const viewSubcontractor = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.id;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('viewSubcontractor', {
            subcontractor,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};
const updateSubcontractor = async (req, res) => {
    try {
        const {
            name,
            company,
            line1,
            line2,
            city,
            county,
            postalCode,
            cisNumber,
            utrNumber,
            onboarded,
            onboardedAt,
            isGross
        } = req.body;
        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (subcontractor) {
            // Update subcontractor data based on the form submission
            subcontractor.name = name;
            subcontractor.company = company;
            subcontractor.line1 = line1;
            subcontractor.line2 = line2;
            subcontractor.city = city;
            subcontractor.county = county;
            subcontractor.postalCode = postalCode;
            subcontractor.cisNumber = cisNumber;
            subcontractor.utrNumber = utrNumber;
            subcontractor.onboarded = onboarded;
            subcontractor.onboardedAt = onboardedAt;
            subcontractor.isGross = isGross;
            // ... update other fields as needed ...
            await subcontractor.save();

            req.flash('success', 'Subcontractor updated.');
            const referrer = '/admin';
            res.redirect(referrer);
        } else {
            req.flash('error', 'Subcontractor not found');
            const referrer = '/admin';
            res.redirect(referrer);
        }
    } catch (error) {
        // Handle error
        console.error('Error updating subcontractor:', error);
        req.flash('error', 'Error updating subcontractor: ' + error.message);
        const referrer = '/admin';
        res.redirect(referrer);
    }
};
const deleteSubcontractor = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete subcontractors.');
        }

        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (!subcontractor) {
            // res.status(404).send('Subcontractor not found');
            return req.flash('error', 'Subcontractor not found');
        }

        await subcontractor.destroy();

        req.flash('success', 'Subcontractor deleted successfully');
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    }
};

module.exports = {
    createSubcontractor,
    viewSubcontractor,
    updateSubcontractor,
    deleteSubcontractor
};