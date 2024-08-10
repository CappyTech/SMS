const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');
const packageJson = require('../../package.json');
const path = require('path');
const Subcontractor = require('../../models/subcontractor');

const selectSubcontractor = async (req, res) => {
    try {
        
        let subcontractors;
        if (req.session.user.role === 'admin') {
            subcontractors = await Subcontractor.findAll({});
        } else {
            subcontractors = await Subcontractor.findAll({
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
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            subcontractors,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error selecting subcontractor:' + error.message);
        req.flash('error', 'Error selecting subcontractor: ' + error.message);
        return res.redirect('/');
    }
};

const renderSubcontractorCreateForm = (req, res) => {
    try {
        
        if (req.session.user.role === 'admin') {
            res.render(path.join('subcontractors', 'createSubcontractor'), {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
            });
        } else {
            return res.status(403).send('Access denied.');
        }
    } catch (error) {
        logger.error('Error rendering subcontractor create form:' + error.message);
        req.flash('error', 'Error rendering subcontractor create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderSubcontractorUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.subcontractor;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render(path.join('subcontractors', 'updateSubcontractor'), {
            subcontractor,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering subcontractor update form:' + error.message);
        req.flash('error', 'Error rendering subcontractor update form: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/subcontractor/select', selectSubcontractor);
router.get('/subcontractor/create', renderSubcontractorCreateForm);
router.get('/subcontractor/update/:subcontractor', renderSubcontractorUpdateForm);

module.exports = router;