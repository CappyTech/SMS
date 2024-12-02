const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');
const currencyService = require('../../services/currencyService');
const dateService = require('../../services/dateService');

const selectSubcontractor = async (req, res) => {
    try {
        let subcontractors;
        if (req.session.user.role === 'admin') {
            subcontractors = await db.Subcontractor.findAll({});
        } else {
            subcontractors = await db.Subcontractor.findAll({
                where: {
                    userId: req.session.user.id
                }
            });
        }

        if (subcontractors.length === 0) {
            req.flash('error', 'Error: No Subcontractors exist, Or you don\'t have access to any Subcontractors.');
            res.redirect('/subcontractor/create');
        }

        res.render(path.join('subcontractors', 'selectSubcontractor'), {
            title: 'Select Subcontractor',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            subcontractors,
            slimDateTime: dateService.slimDateTime,
            formatCurrency: currencyService.formatCurrency,
        });
    } catch (error) {
        logger.error('Error selecting subcontractor:' + error.message);
        req.flash('error', 'Error selecting subcontractor: ' + error.message);
        return res.redirect('/');
    }
};

const renderSubcontractorCreateForm = (req, res) => {
    try {
        res.render(path.join('subcontractors', 'createSubcontractor'), {
            title: 'Create Subcontractor',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),  
        });
    } catch (error) {
        logger.error('Error rendering subcontractor create form: ' + error.message);
        req.flash('error', 'Error rendering subcontractor create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderSubcontractorUpdateForm = async (req, res) => {
    try {
        const subcontractorId = req.params.subcontractor;
        const subcontractor = await db.Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render(path.join('subcontractors', 'updateSubcontractor'), {
            title: 'Update Subcontractor',
            subcontractor,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            slimDateTime: dateService.slimDateTime,
            formatCurrency: currencyService.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering subcontractor update form: ' + error.message);
        req.flash('error', 'Error rendering subcontractor update form: ' + error.message);
        return res.redirect('/');
    }
};

//router.get('/subcontractor/select', selectSubcontractor);
router.get('/subcontractor/create', authService.ensureAuthenticated, authService.ensureRole('admin'), renderSubcontractorCreateForm);
router.get('/subcontractor/update/:subcontractor', authService.ensureAuthenticated, authService.ensureRole('admin'), renderSubcontractorUpdateForm);

module.exports = router;