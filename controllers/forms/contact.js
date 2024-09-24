const express = require('express');
const router = express.Router();
const helpers = require('../../helpers');
const logger = require('../../logger');

const path = require('path');
const Clients = require('../../models/client');
const Contacts = require('../../models/contact');

const selectContact = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const contacts = await Contacts.findAll({
            include: [{ model: Clients, attributes: ['name'] }]
        });

        if (contacts.length === 0) {
            req.flash('error', 'Error: No Contacts exist, or you don\'t have access to any Contacts.');
            return res.redirect('/contact/create');
        }

        const contactList = contacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            clientId: contact.Clients.id,
            clientName: contact.Clients.name
        }));

        res.render(path.join('contacts', 'selectContact'), {
            title: 'Select Contact',
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            contacts: contactList,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error selecting contact:  ', error.message);
        req.flash('error', 'Error selecting contact: ' + error.message);
        return res.redirect('/');
    }
};

const renderContactCreateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        // Find the client by primary key (PK)
        const clients = await Clients.findAll();

        if (!clients) {
            // If the client is not found, send an error message
            req.flash('error', 'Client not found.');
            return res.redirect('/dashboard/client');
        }

        // Render the create contact form and pass the found client to the view
        res.render(path.join('contacts', 'createContact'), {
            title: 'Create Contact',
            clients, // Pass the specific client to the view
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering contact create form: ' + error.message);
        res.status(500).send('Error: ' + error.message);
    }
};


const renderContactUpdateForm = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const contact = await Contacts.findByPk(req.params.contact, {
            include: [{ model: Clients }]
        });

        if (!contact) {
            return res.status(404).send('Contact not found');
        }

        res.render(path.join('contacts', 'updateContact'), {
            title: 'Update Contact',
            contact,
            clients: contact.Clients,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
        });
    } catch (error) {
        logger.error('Error rendering contact update form:' + error.message);
        return res.status(500).send('Error: ' + error.message);
    }
};

//router.get('/contact/select', selectContact);
router.get('/contact/create/', helpers.ensureAuthenticated, renderContactCreateForm);
router.get('/contact/update/:contact', helpers.ensureAuthenticated, renderContactUpdateForm);

module.exports = router;