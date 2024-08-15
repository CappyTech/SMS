const express = require('express');
const router = express.Router();

const Subcontractor = require('../../models/subcontractor');
const helpers = require('../../helpers');
const { Op } = require('sequelize');
const logger = require('../../logger'); 
const path = require('path');

const createSubcontractor = async (req, res) => {
    try {
        //logger.info('Session User: ' + JSON.stringify(req.session.user, null, 2));
        // Check if the user has permissions
        if (!req.session) {
            logger.error("Session does not exist.");
            return res.status(403).send('Access denied. No session found.');
        }

        if (!req.session.user) {
            logger.error("User not found in session.");
            return res.status(403).send('Access denied. No user found in session.');
        }

        if (!req.session.user.permissionCreateSubcontractor) {
            logger.error("User does not have permission to create subcontractor.");
            return res.status(403).send('Access denied. Insufficient permissions.');
        }

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

        // Check if the subcontractor already exists
        const existingSubcontractor = await Subcontractor.findOne({
            where: {
                [Op.or]: [{ utrNumber }],
            },
        });

        if (existingSubcontractor) {
            req.flash('error', 'User with the same UTR already exists.');
            return res.redirect('/subcontractor/create'); // Redirect to the appropriate page
        }

        const requiredFields = [company, utrNumber];
        if (requiredFields.some(field => !field)) {
            req.flash('error', 'Incomplete required form data.');
            return res.redirect('/subcontractor/create');
        }

        // Null checks for specific fields
        const nullCheckFields = ['company', 'utrNumber'];
        const sanitizedData = Object.fromEntries(
            Object.entries(req.body).map(([key, value]) => [
                key,
                nullCheckFields.includes(key) ? value || null : value,
            ])
        );
        logger.info('Data to be inserted: ' + sanitizedData);
        await Subcontractor.create(sanitizedData);

        req.flash('success', 'Subcontractor created.');
        const referer = '/dashboard/subcontractor';
        res.redirect(referer);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            logger.error('Unique constraint error: ', error);
            req.flash('error', 'A subcontractor with this UTR, or VAT number already exists.');
            return res.redirect('/subcontractor/create');
        }
        logger.error('Error creating subcontractor: ' + error.message);
        req.flash('error', 'Error creating subcontractor: ' + error.message);
        return res.redirect('/');
    }
};

const readSubcontractor = async (req, res) => {
    try {
        // Check if the user has permissions
        if (!req.session.user.permissionReadSubcontractor) {
            return res.status(403).send('Access denied.');
        }

        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render(path.join('subcontractors', 'viewSubcontractor'), {
            title: 'Subcontractor',
            subcontractor,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error reading subcontractor:  ', error.message);
        req.flash('error', 'Error reading subcontractor: ' + error.message);
        return res.redirect('/');
    }
};

const updateSubcontractor = async (req, res) => {
    try {
        // Check if session exists
        if (!req.session) {
            logger.error("Session does not exist.");
            return res.status(403).send('Access denied. No session found.');
        }

        // Check if user is authenticated
        if (!req.session.user) {
            logger.error("User not found in session.");
            return res.status(403).send('Access denied. No user found in session.');
        }

        // Check if user has permission
        if (!req.session.user.permissionUpdateSubcontractor) {
            logger.error("User does not have permission to update subcontractor.");
            return res.status(403).send('Access denied. Insufficient permissions.');
        }

        // Extract data from the request body
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
            isGross,
            isReverseCharge
        } = req.body;

        // Find the subcontractor by ID
        const subcontractor = await Subcontractor.findByPk(req.params.id);

        // If subcontractor is not found
        if (!subcontractor) {
            req.flash('error', 'Subcontractor not found.');
            logger.warn('Subcontractor not found.');
            return res.redirect('/dashboard/subcontractor');
        }

        // Check for unique utrNumber only if it's provided and different from the existing one
        if (utrNumber && subcontractor.utrNumber !== utrNumber) {
            const existingUtr = await Subcontractor.findOne({
                where: { utrNumber, id: { [Op.ne]: req.params.id } }
            });
            if (existingUtr) {
                req.flash('error', 'A subcontractor with this UTR number already exists.');
                return res.redirect('/subcontractor/update/' + req.params.id);
            }
        }

        // Check for unique vatNumber only if it's provided and different from the existing one
        if (vatNumber && subcontractor.vatNumber !== vatNumber) {
            const existingVat = await Subcontractor.findOne({
                where: { vatNumber, id: { [Op.ne]: req.params.id } }
            });
            if (existingVat) {
                req.flash('error', 'A subcontractor with this VAT number already exists.');
                return res.redirect('/subcontractor/update/' + req.params.id);
            }
        }

        // Prepare updated data with null values for empty or undefined fields
        const updatedData = {
            name: name || null,
            company: company || null,
            line1: line1 || null,
            line2: line2 || null,
            city: city || null,
            county: county || null,
            postalCode: postalCode || null,
            cisNumber: cisNumber || null,
            utrNumber: utrNumber || null,
            vatNumber: vatNumber || null,
            deduction: deduction || null,
            isGross: isGross || false,
            isReverseCharge: isReverseCharge || false
        };

        // Update subcontractor with sanitized data
        await Subcontractor.update(updatedData, { where: { id: req.params.id } });

        // Flash success message and redirect
        req.flash('success', 'Subcontractor updated successfully.');
        logger.info('Subcontractor updated successfully.');
        return res.redirect('/dashboard/subcontractor');

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            logger.error('Unique constraint error: ', error);
            req.flash('error', 'A subcontractor with this UTR or VAT number already exists.');
            return res.redirect('/subcontractor/update/' + req.params.id);
        }
        logger.error('Error updating subcontractor: ' + error.message);
        req.flash('error', 'Error updating subcontractor: ' + error.message);
        return res.redirect('/dashboard/subcontractor');
    }
};




const deleteSubcontractor = async (req, res) => {
    try {
        // Check if the user has permissions
        if (!req.session.user.permissionDeleteSubcontractor) {
            return res.status(403).send('Access denied.');
        }

        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (!subcontractor) {
            req.flash('error', 'Subcontractor not found');
            logger.warn('Subcontractor not found.');
            return res.redirect('/dashboard/subcontractor');
        }

        await subcontractor.destroy();

        req.flash('success', 'Subcontractor deleted.');
        logger.info('Subcontractor deleted.');
        res.redirect('/dashboard/subcontractor');
    } catch (error) {
        logger.error('Error deleting subcontractor:  ', error.message);
        req.flash('error', 'Error deleting subcontractor: ' + error.message);
        res.redirect('/dashboard/subcontractor');
    }
};

router.post('/subcontractor/create/', createSubcontractor);
router.get('/subcontractor/read/:id', readSubcontractor);
router.post('/subcontractor/update/:id', updateSubcontractor);
router.post('/subcontractor/delete/:id', deleteSubcontractor);

module.exports = router;
