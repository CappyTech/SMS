const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');
const packageJson = require('../../package.json');
const path = require('path');
const Clients = require('../../models/client');
const Contacts = require('../../models/contact');

const selectClient = async (req, res) => {
    try {
        
        const clients = await Clients.findAll({});
        
        if (clients.length === 0) {
            req.flash('error', 'Error: No Clients exist, Or you don\'t have access to any Clients.');
            res.redirect('/client/create');
        }

        res.render(path.join('clients', 'selectClient'), {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            clients,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
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
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering client create form:' + error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

const renderClientUpdateForm = async (req, res) => {
    try {
        const clients = await Clients.findByPk(req.params.client, {
            include: [{ model: Contacts }]
        });

        if (!clients) {
            return res.status(404).send('Client not found');
        }

        res.render(path.join('clients', 'updateClient'), {
            clients,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering client update form:' + error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

router.get('/client/select', selectClient);
router.get('/client/create', renderClientCreateForm);
router.get('/client/update/:client', renderClientUpdateForm);

module.exports = router;