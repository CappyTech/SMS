// /controllers/subcontractorCRUD.js

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const createSubcontractor = async (req, res) => {
    /* ... */
};
const viewSubcontractor = async (req, res) => {
    /* ... */
};
const updateSubcontractor = async (req, res) => {
    /* ... */
};
const deleteSubcontractor = async (req, res) => {
    /* ... */
};

module.exports = {
    createSubcontractor,
    viewSubcontractor,
    updateSubcontractor,
    deleteSubcontractor
};