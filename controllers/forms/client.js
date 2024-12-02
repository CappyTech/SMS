const express = require('express');
const router = express.Router();
const logger = require('../../services/loggerService');
const path = require('path');
const db = require('../../services/sequelizeDatabaseService');
const authService = require('../../services/authService');
const currencyService = require('../../services/currencyService');
const dateService = require('../../services/dateService');

const selectClient = async (req, res) => {
    try {
        const clients = await db.Clients.findAll({});
        
        if (clients.length === 0) {
            req.flash('error', 'Error: No Clients exist, Or you don\'t have access to any Clients.');
            res.redirect('/client/create');
        }

        res.render(path.join('clients', 'selectClient'), {
            title: 'Select Client',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
            
            clients,
            slimDateTime: dateService.slimDateTime,
            formatCurrency: currencyService.formatCurrency,
        });
    } catch (error) {
        logger.error('Error selecting client:  ', error.message);
        req.flash('error', 'Error selecting client: ' + error.message);
        return res.redirect('/');
    }
};

const renderClientCreateForm = async (req, res) => {
    try {
        res.render(path.join('clients', 'createClient'), {
            title: 'Create Client',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering client create form:' + error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

const renderClientUpdateForm = async (req, res) => {
    try {
        const clients = await db.Clients.findByPk(req.params.client, {
            include: [{ model: db.Contacts }]
        });

        if (!clients) {
            return res.status(404).send('Client not found');
        }

        res.render(path.join('clients', 'updateClient'), {
            title: 'Update Client',
            clients,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering client update form:' + error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

//router.get('/client/select', selectClient);
router.get('/client/create', authService.ensureAuthenticated, authService.ensureRole('admin'), renderClientCreateForm);
router.get('/client/update/:client', authService.ensureAuthenticated, authService.ensureRole('admin'), renderClientUpdateForm);

module.exports = router;