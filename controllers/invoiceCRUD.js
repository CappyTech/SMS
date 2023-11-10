// /controllers/invoiceCRUD.js

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const viewInvoice = async (req, res) => {
    /* ... */
};
const updateInvoice = async (req, res) => {
    /* ... */
};
const deleteInvoice = async (req, res) => {
    /* ... */
};

module.exports = {
    viewInvoice,
    updateInvoice,
    deleteInvoice
};