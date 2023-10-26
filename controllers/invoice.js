// controllers/invoice.js

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

// Display the invoice creation form
const selectSubcontractor = async (req, res) => {
    try {
        console.log(req.session);
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
            return res.redirect('/subcontractor/create?message=No subcontractors exist, Or you don\'t have access to any Subcontractors.');
        }

        res.render('selectSubcontractor', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            subcontractors,
            message: req.query.message || '',
            slimDateTime: helpers.slimDateTime,
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

// Display the invoice creation form
const renderInvoiceForm = async (req, res) => {
    try {
        console.log(req.session);
        if (req.params.selected) {
            const subcontractor = await Subcontractor.findByPk(req.params.selected);
            if (!subcontractor) {
                return res.redirect('/subcontractor/create?message=No subcontractors exist');
            }
            return res.render('createInvoice', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                subcontractor,
                message: req.query.message || '',
                slimDateTime: helpers.slimDateTime,
            });
        }
        return res.send('Subcontractor not found');
    } catch (error) {
        return req.flash('error', 'Error: ' + error.message);
    }
};

// Handle the submission of the invoice creation form
const createInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
            kashflowNumber,
            invoiceDate,
            remittanceDate,
            labourCost,
            materialCost,
            submissionDate,
        } = req.body;
        console.log(req.body);

        // Convert submissionDate to null if it's '0000-00-00 00:00:00'
        const convertedSubmissionDate = submissionDate === '0000-00-00 00:00:00' ? null : submissionDate;

        const subcontractor = await Subcontractor.findByPk(req.params.selected);

        if (!subcontractor) {
            return res.send('Subcontractor not found');
        }

        if (subcontractor.isGross) {
            const cisAmount = 0;
            const netAmount = parseInt(labourCost) - parseInt(cisAmount) + parseInt(materialCost);
            const grossAmount = parseInt(labourCost) + parseInt(materialCost);
            const reverseCharge = parseInt(grossAmount) * 0.2;

            const invoice = await Invoice.create({
                invoiceNumber,
                kashflowNumber,
                invoiceDate,
                remittanceDate,
                grossAmount,
                labourCost,
                materialCost,
                cisAmount,
                netAmount,
                convertedSubmissionDate,
                reverseCharge,
                SubcontractorId: subcontractor.id,
            });

            await subcontractor.addInvoice(invoice);

            return res.send('Invoice created successfully');
        } else {
            const cisAmount = parseInt(labourCost) * 0.2;
            const netAmount = parseInt(labourCost) - parseInt(cisAmount) + parseInt(materialCost);
            const grossAmount = parseInt(labourCost) + parseInt(materialCost);
            const reverseCharge = parseInt(grossAmount) * 0.2;

            const invoice = await Invoice.create({
                invoiceNumber,
                kashflowNumber,
                invoiceDate,
                remittanceDate,
                grossAmount,
                labourCost,
                materialCost,
                cisAmount,
                netAmount,
                convertedSubmissionDate,
                reverseCharge,
                SubcontractorId: subcontractor.id,
            });

            await subcontractor.addInvoice(invoice);

            return res.send('Invoice created successfully');
        }
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errorMessages = error.errors.map((err) => err.message);
            console.log('Validation errors:', errorMessages);
            return res.render('createInvoice', {
                errorMessages: req.flash('error'),
                successMessage: req.flash('success'),
                session: req.session,
                packageJson,
                message: req.query.message || '',
            });
        }
        console.error('Error creating invoice:', error);
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
};

module.exports = {
    selectSubcontractor,
    renderInvoiceForm,
    createInvoice
};