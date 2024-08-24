const express = require('express');
const router = express.Router();

const helpers = require('../../helpers');
const moment = require('moment');
const logger = require('../../logger');
const path = require('path');
const Contacts = require('../../models/contact');
const Clients = require('../../models/client');

const createContact = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            note
        } = req.body;

        const clientId = req.params.client;
        if (!clientId) {
            req.flash('erorr', 'Client wasn\'t specificied.');
            return res.redirect('/');
        } else {
            const contact = await Contacts.create({
                clientId:clientId,
                name:name,
                phone:phone,
                email:email,
                note:note,
            });
            req.flash('success', 'Contact created successfully');
            return res.redirect(`/client/read/${contact.clientId}`);
        }
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errorMessages = error.errors.map((err) => err.message);
            logger.error(`Validation errors: ${errorMessages.join(', ')}`);
        }
        logger.error('Error creating contact:' + error.message);
        req.flash('error', 'Error: ' + error.message);
        return res.redirect('/dashboard/client');
    }
};

const readContact = async (req, res) => {
    try {
        // Check if session exists and session user role is an admin
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/'); // Ensure to return here
        }

        const contact = await Contacts.findByPk(req.params.contact, {
            include: [
                { model: Clients }
            ]
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.render(path.join('contacts', 'viewContact'), {
            title: 'Contact',
            contact,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
            
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error viewing contact:'+ error.message);
        req.flash('error', 'Error viewing contact:' + error.message);
        res.redirect('/error');
    }
};

const readContacts = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const clients = await Clients.findByPk(req.params.client);

        const contacts = await Contacts.findAll({
            where: { clientId: req.params.client },
            order: [['name', 'ASC']]
        });

        if (!contacts) {
            return res.status(404).json({ error: 'Contacts not found' });
        }

        res.render(path.join('contacts', 'viewContacts'), {
            title: 'Contacts',
            clients,
            contacts,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            
            
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error viewing contacts: ' + error.message);
        req.flash('error', 'Error viewing contacts: ' + error.message);
        res.redirect('/error');
    }
};

const updateContact = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }

        const { name, phone, email, note } = req.body;
        const contact = await Contacts.findByPk(req.params.contact);

        if (!contact) {
            return res.status(404).send('Contact not found');
        }

        contact.name = name;
        contact.phone = phone;
        contact.email = email;
        contact.note = note;
        await contact.save();

        req.flash('success', 'Contact updated successfully');
        return res.redirect(`/client/read/${contact.clientId}`);
    } catch (error) {
        logger.error('Error updating contact: ' + error.message);
        req.flash('error', 'Error: ' + error.message);
        return res.redirect(`/client/read/${req.params.client}`);
    }
};

const deleteContact = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const contact = await Contacts.findByPk(req.params.contact);

        if (!contact) {
            return res.status(404).send('Contact not found');
        }

        await contact.destroy();
        req.flash('success', 'Contact deleted successfully');
        return res.redirect('/dashboard/client/');
    } catch (error) {
        logger.error('Error deleting contact: ' + error.message);
        req.flash('error', 'Error: ' + error.message);
        return res.redirect(`/dashboard/client`);
    }
};

router.get('/contacts/by-client/:clientId', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            req.flash('error', 'Access denied.');
            return res.redirect('/');
        }
        const contacts = await Contacts.findAll({
            where: { clientId: req.params.clientId },
            order: [['name', 'ASC']],
        });

        res.json({ contacts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

router.post('/contact/create/:client', createContact);
router.get('/contact/read/:contact', readContact);
router.get('/contacts/read/:client', readContacts);
router.post('/contact/update/:contact', updateContact);
router.post('/contact/delete/:contact', deleteContact);

module.exports = router;