const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');

const selectSubcontractor = async (req, res) => {
    try {
        let subcontractors;
        if (req.session.user.role === 'admin') {
            subcontractors = await db.Subcontractors.findAll({});
        } else {
            subcontractors = await db.Subcontractors.findAll({
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
            
            subcontractors,

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
        const subcontractor = await db.Subcontractors.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render(path.join('subcontractors', 'updateSubcontractor'), {
            title: 'Update Subcontractor',
            subcontractor,
            

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