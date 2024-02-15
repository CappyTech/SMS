// /controllers/subcontractorCRUD.js

const express = require('express');
const router = express.Router();

const packageJson = require('../package.json');
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
            vatNumber,
            deduction,
            isGross
        } = req.body;

        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        // Check if the subcontractor already exists by username or email
        const existingSubcontractor = await Subcontractor.findOne({
            where: {
                [Op.or]: [{
                    utrNumber
                }],
            },
        });

        if (existingSubcontractor) {
            req.flash('error', 'User with the same UTR already exists.');
            return res.redirect('/subcontractor/create'); // Redirect to the appropriate page
        }

        if (!company || !line1 || !city || !county || !postalCode || !cisNumber || !utrNumber || !deduction) {
            req.flash('error', 'Incomplete form data.');
            return res.redirect('/subcontractor/create'); // Redirect to the appropriate page
        }

        const nullCheckname = name || null;
        const nullCheckline2 = line2 || null;
        const nullCheckcisNumber = cisNumber || null;
        const nullCheckutrNumber = utrNumber || null;
        const nullCheckvatNumber = vatNumber || null;

        await Subcontractor.create({
            name: nullCheckname,
            company,
            line1,
            line2: nullCheckline2,
            city,
            county,
            postalCode,
            cisNumber: nullCheckcisNumber,
            utrNumber: nullCheckutrNumber,
            vatNumber: nullCheckvatNumber,
            deduction,
            isGross
        });

        req.flash('success', 'Subcontractor created.');
        const referrer = '/dashboard';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error creating subcontractor: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};
const readSubcontractor = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('viewSubcontractor', {
            subcontractor,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
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
            isGross,
            vatnumber,
            deduction,
        } = req.body;

        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (subcontractor) {

            subcontractor.name = name;
            subcontractor.company = company;
            subcontractor.line1 = line1;
            subcontractor.line2 = line2;
            subcontractor.city = city;
            subcontractor.county = county;
            subcontractor.postalCode = postalCode;
            subcontractor.cisNumber = cisNumber;
            subcontractor.utrNumber = utrNumber;
            subcontractor.isGross = isGross;
            subcontractor.vatnumber = vatnumber;
            subcontractor.deduction = deduction;

            await subcontractor.save();

            req.flash('success', 'Subcontractor updated.');
            console.log('Subcontractor updated.');
            const referrer = '/dashboard';
            res.redirect(referrer);
        } else {
            req.flash('error', 'Subcontractor not found.');
            console.log('Subcontractor not found.');
            const referer = req.get('referer') ? req.get('referer') : '/dashboard';
            res.redirect(referer);
        }
    } catch (error) {
        // Handle error
        console.error('Error updating subcontractor:', error);
        req.flash('error', 'Error updating subcontractor: ' + error.message);
        const referer = req.get('referer') ? req.get('referer') : '/dashboard';
        res.redirect(referer);
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

        req.flash('success', 'Subcontractor deleted.');
        console.log('Subcontractor deleted.');
        const referer = req.get('referer') ? req.get('referer') : '/dashboard';
        res.redirect(referer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referer = req.get('referer') ? req.get('referer') : '/dashboard';
        res.redirect(referer);
    }
};

router.post('/subcontractor/create/', createSubcontractor);
router.get('/subcontractor/read/:id', readSubcontractor);
router.post('/subcontractor/update/:id', updateSubcontractor);
router.get('/subcontractor/delete/:id', deleteSubcontractor);

module.exports = router;