const express = require('express');
const router = express.Router();
const packageJson = require('../package.json');
const helpers = require('../helpers');
const moment = require('moment');
const logger = require('../logger');

const Contact = require('../models/contact');

const createContact = async (req, res) => {
    try {
        const { name } = req.body;
        const contact = await Contact.create({
            name
        });
        req.flash('success', 'Contact created successfully');
        return res.redirect(`/client/read/${contact.clientId}`);
    } catch (error) {
        logger.error('Error creating contact:', error.message);
        req.flash('error', 'Error: ' + error.message);
        return res.redirect(req.get('referer') || '/');
    }
};

const deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);

        if (!Contact) {
            return res.status(404).send('Contact not found');
        }

        await contact.destroy();
        req.flash('success', 'Contact deleted successfully');
        return res.redirect(`dashboard/client/`);
    } catch (error) {
        logger.error('Error deleting  contact:', error.message);
        req.flash('error', 'Error: ' + error.message);
        return res.redirect(`/client/read/${contact.clientId}`);
    }
};

router.post('/contact/create/', createContact);
router.post('/contact/delete/:id', deleteContact);

module.exports = router;