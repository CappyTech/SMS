// /controllers/userCRUD.js

const packageJson = require('../package.json');
const User = require('../models/user');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const helpers = require('../helpers');

const createUser = async (req, res) => {
    /* ... */
};
const viewUser = async (req, res) => {
    /* ... */
};
const updateUser = async (req, res) => {
    /* ... */
};
const deleteUser = async (req, res) => {
    /* ... */
};

module.exports = {
    createUser,
    viewUser,
    updateUser,
    deleteUser
};