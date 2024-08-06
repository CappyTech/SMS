const express = require('express');
const router = express.Router();
const moment = require('moment');
const helpers = require('../helpers');
const logger = require('../logger');
const packageJson = require('../package.json');

const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const Quote = require('../models/quote');
const Clients = require('../models/client');
const Contacts = require('../models/contact');

const renderIndex = (req, res) => {
    res.render('index', {
        errorMessages: req.flash('error'),
        successMessage: req.flash('success'),
        session: req.session,
        packageJson,
    });
};

const renderUserCreateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        res.render('createUser', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering user create form:' + error.message);
        req.flash('error', 'Error rendering user create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderUserUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const userId = req.params.user;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('updateUser', {
            user,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering user update form:' + error.message);
        req.flash('error', 'Error rendering user update form: ' + error.message);
        return res.redirect('/');
    }
};

const renderInvoiceCreateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }
        
        if (req.params.subcontractor) {
            const subcontractor = await Subcontractor.findByPk(req.params.subcontractor);
            if (!subcontractor) {
                req.flash('error', 'Error: No Subcontractors exist.');
                res.redirect('/subcontractor/create');
            }
            res.render('createInvoice', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                subcontractor,
                slimDateTime: helpers.slimDateTime,
                formatCurrency: helpers.formatCurrency,
            });
        } else {
            res.status(404).send('Subcontractor not found');
        }
    } catch (error) {
        logger.error('Error rendering invoice create form:' + error.message);
        req.flash('error', 'Error rendering invoice create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderInvoiceUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const invoice = await Invoice.findByPk(req.params.invoice);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render('updateInvoice', {
            invoice,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering invoice update form:  ', error.message);
        req.flash('error', 'Error rendering invoice update form: ' + error.message);
        return res.redirect('/');
    }
};

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

        res.render('selectSubcontractor', {
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
            res.render('createSubcontractor', {
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
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.subcontractor;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('updateSubcontractor', {
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

const renderQuoteCreateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        if (req.params.client) {
            const clients = await Clients.findByPk(req.params.client, {
                include: [Contact]
            });
            if (!clients) {
                req.flash('error', 'Error: No Clients exist.');
                return res.redirect('/client/create');
            }
            return res.render('createQuote', {
                clients,
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
            });
        } else {
            return res.status(404).send('Client not found');
        }
    } catch (error) {
        logger.error('Error rendering quote create form:' + error.message);
        req.flash('error', 'Error rendering quotes create form: ' + error.message);
        return res.redirect('/');
    }
};

const renderQuoteUpdateForm = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const quote = await Quote.findByPk(req.params.quote, {
            include: [{
                model: Clients,
                include: [Contacts]
            }]
        });

        if (!quote) {
            return res.status(404).send('Quote not found');
        }

        logger.info(JSON.stringify(quote, null, 2));

        return res.render('updateQuote', {
            quote,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        logger.error('Error rendering quote update form:  ', error.message);
        req.flash('error', 'Error rendering quote update form: ' + error.message);
        return res.redirect('/');
    }
};

const selectClient = async (req, res) => {
    try {
        
        const clients = await Clients.findAll({});
        
        if (clients.length === 0) {
            req.flash('error', 'Error: No Clients exist, Or you don\'t have access to any Clients.');
            res.redirect('/client/create');
        }

        res.render('selectClient', {
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
        res.render('createClient', {
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
            include: [{ model: Contact }]
        });

        if (!clients) {
            return res.status(404).send('Client not found');
        }

        res.render('updateClient', {
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

const selectContact = async (req, res) => {
    try {
        const contacts = await Contact.findAll({
            include: [{ model: Client, attributes: ['name'] }]
        });

        if (contacts.length === 0) {
            req.flash('error', 'Error: No Contacts exist, or you don\'t have access to any Contacts.');
            return res.redirect('/contact/create');
        }

        const contactList = contacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            clientId: contact.Client.id,
            clientName: contact.Client.name
        }));

        res.render('selectContact', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
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
        const contact = await Contact.findAll({
            include: [{ model: Clients }]
        });

        res.render('createContact', {
            contact,
            clients: contact.Client,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering contact create form:' + error.message);
        res.status(500).send('Error: ' + error.message);
    }
};

const renderContactUpdateForm = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.contact, {
            include: [{ model: Clients }]
        });

        if (!contact) {
            return res.status(404).send('Contact not found');
        }

        res.render('updateContact', {
            contact,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering contact update form:' + error.message);
        return res.status(500).send('Error: ' + error.message);
    }
};

const e500 = async (req, res) => {
    try {
        res.render('500', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering 500 page:  ', error.message);
        req.flash('error', 'Error rendering 500 page: ' + error.message);
        return res.redirect('/');
    }
};

const e404 = async (req, res) => {
    try {
        res.render('404', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering 404 page:  ', error.message);
        req.flash('error', 'Error rendering 404 page: ' + error.message);
        return res.redirect('/');
    }
};

const e403 = async (req, res) => {
    try {
        res.render('403', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
        });
    } catch (error) {
        logger.error('Error rendering 403 page:  ', error.message);
        req.flash('error', 'Error rendering 403 page: ' + error.message);
        return res.redirect('/');
    }
};

router.get('/', renderIndex);

router.get('/user/create', renderUserCreateForm);
router.get('/user/update/:user', renderUserUpdateForm);

router.get('/subcontractor/create', renderSubcontractorCreateForm);
router.get('/subcontractor/update/:subcontractor', renderSubcontractorUpdateForm);

router.get('/invoice/create/:subcontractor', renderInvoiceCreateForm);
router.get('/invoice/update/:invoice', renderInvoiceUpdateForm);
router.get('/subcontractor/select', selectSubcontractor);

router.get('/quote/create/:client', renderQuoteCreateForm);
router.get('/quote/update/:quote', renderQuoteUpdateForm);
router.get('/client/select', selectClient);

router.get('/client/create', renderClientCreateForm);
router.get('/client/update/:client', renderClientUpdateForm);
router.get('/contact/select', selectContact);

router.get('/contact/create/:client', renderContactCreateForm);
router.get('/contact/update/:contact', renderContactUpdateForm);

router.get('/500', e500);
router.get('/404', e404);
router.get('/403', e403);

module.exports = router;
