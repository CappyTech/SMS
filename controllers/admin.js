// controllers/admin.js

const packageJson = require('../package.json');
const Invoice = require('../models/invoice');
const Subcontractor = require('../models/subcontractor');
const User = require('../models/user');
const helpers = require('../helpers');
const {
    Op
} = require('sequelize');

// Render the admin dashboard
const renderAdminDashboard = async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        console.log(req.session);
        const userCount = await User.count();
        const subcontractorCount = await Subcontractor.count();
        const invoiceCount = await Invoice.count();

        const users = await User.findAll();
        const subcontractors = await Subcontractor.findAll();
        const invoices = await Invoice.findAll();

        //const user = await User.findByPk();

        res.render('adminDashboard', {
            userCount,
            subcontractorCount,
            invoiceCount,
            users,
            subcontractors,
            invoices,
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
            message: req.query.message || '',
        });
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.header('Referer') || '/';
        res.redirect(referrer);
    }
};

// Render the create form for a user
const renderUserCreateForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can create users.');
        }

        res.render('createUser', {
            session: req.session,
            packageJson,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Handle the form submission for creating a new user
const createUser = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            role
        } = req.body;

        // Check if the user already exists by username or email
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{
                    username
                }, {
                    email
                }],
            },
        });

        if (existingUser) {
            req.flash('error', 'User with the same username or email already exists.');
            return res.redirect('/admin'); // Redirect to the appropriate page
        }

        // Create the new user
        const newUser = await User.create({
            username,
            email,
            password,
            role,
        });

        req.flash('success', 'User created successfully.');
        res.redirect('/admin'); // Redirect to the appropriate page
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.header('Referer') || '/';
        res.redirect(referrer);
    }
};

// View a user
const viewUser = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can view users.');
        }

        const userId = req.params.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('viewUser', {
            user,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

const renderSubcontractorCreateForm = (req, res) => {
    console.log(req.session);
    if (req.session.user.role === 'admin') {

        res.render('createSubcontractor', {
            errorMessages: req.flash('error'),
            successMessage: req.flash('success'),
            session: req.session,
            packageJson,
            message: req.query.message || '',
        });
    } else {
        return res.status(403).send('Access denied.');
    }
};

// Handle the submission of the subcontractor creation form
async function createSubcontractor(req, res) {
    try {

        const {
            name,
            company,
            line1,
            line2,
            city,
            county,
            postalCode,
            cisNumber,
            utrNumber,
            isGross
        } = req.body;

        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        // Check if the subcontractor already exists by username or email
        const existingSubcontractor = await Subcontractor.findOne({
            where: {
                [Op.or]: [{
                    name
                }, {
                    company
                }, {
                    utrNumber
                }, {
                    cisNumber
                }],
            },
        });

        if (existingSubcontractor) {
            req.flash('error', 'User with the same username or email already exists.');
            return res.redirect('/admin'); // Redirect to the appropriate page
        }

        if (!name || !company || !line1 || !city || !county || !postalCode || !cisNumber || !utrNumber) {
            return res.status(400).send('Incomplete form data');
        }


        await Subcontractor.create({
            name,
            company,
            line1,
            line2,
            city,
            county,
            postalCode,
            cisNumber,
            utrNumber,
            isGross
        });

        req.flash('success', 'Subcontractor created.');
        const referrer = '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error creating subcontractor: ' + error.message);
        const referrer = req.get('referer') || '/';
        res.redirect(referrer);
    }
}

// View a subcontractor
const viewSubcontractor = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.id;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('viewSubcontractor', {
            subcontractor,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// View an invoice
const viewInvoice = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const invoiceId = req.params.id;
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render('viewInvoice', {
            invoice,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Render the edit form for a user
const renderUserEditForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const userId = req.params.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('editUser', {
            user,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Update User
const updateUser = async (req, res) => {
    try {
        const {
            username,
            email,
            role
        } = req.body;

        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const user = await User.findByPk(req.params.id);

        if (user) {
            // Update user data based on the form submission
            user.username = username;
            user.email = email;
            user.role = role;
            await user.save();

            req.flash('success', 'User updated.');
            const referrer = '/admin';
            res.redirect(referrer);
        } else {
            req.flash('error', 'User not found');
            const referrer = '/admin';
            res.redirect(referrer);
        }
    } catch (error) {
        // Handle error
        console.error('Error updating user:', error);
        req.flash('error', 'Error updating user: ' + error.message);
        const referrer = '/';
        res.redirect(referrer);
    }
};

// Render the edit form for a subcontractor
const renderSubcontractorEditForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied.');
        }

        const subcontractorId = req.params.id;
        const subcontractor = await Subcontractor.findByPk(subcontractorId);

        if (!subcontractor) {
            return res.status(404).send('Subcontractor not found');
        }

        res.render('editSubcontractor', {
            subcontractor,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

// Update Subcontractor
const updateSubcontractor = async (req, res) => {
    try {
        const {
            name,
            company,
            line1,
            line2,
            city,
            county,
            postalCode,
            cisNumber,
            utrNumber,
            onboarded,
            onboardedAt,
            isGross
        } = req.body;
        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (subcontractor) {
            // Update subcontractor data based on the form submission
            subcontractor.name = name;
            subcontractor.company = company;
            subcontractor.line1 = line1;
            subcontractor.line2 = line2;
            subcontractor.city = city;
            subcontractor.county = county;
            subcontractor.postalCode = postalCode;
            subcontractor.cisNumber = cisNumber;
            subcontractor.utrNumber = utrNumber;
            subcontractor.onboarded = onboarded;
            subcontractor.onboardedAt = onboardedAt;
            subcontractor.isGross = isGross;
            // ... update other fields as needed ...
            await subcontractor.save();

            req.flash('success', 'Subcontractor updated.');
            const referrer = '/admin';
            res.redirect(referrer);
        } else {
            req.flash('error', 'Subcontractor not found');
            const referrer = '/admin';
            res.redirect(referrer);
        }
    } catch (error) {
        // Handle error
        console.error('Error updating subcontractor:', error);
        req.flash('error', 'Error updating subcontractor: ' + error.message);
        const referrer = '/admin';
        res.redirect(referrer);
    }
};

// Render the edit form for an invoice
const renderInvoiceEditForm = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can edit invoices.');
        }

        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).send('Invoice not found');
        }

        res.render('editInvoice', {
            invoice,
            session: req.session,
            packageJson,
            slimDateTime: helpers.slimDateTime,
            formatCurrency: helpers.formatCurrency,
        });
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
};

const validateInvoiceData = (data) => {
    const {
        invoiceNumber,
        kashflowNumber,
        labourCost,
        materialCost,
        month,
        year
    } = data;

    if (!invoiceNumber || !kashflowNumber || !labourCost || !materialCost || !month || !year) {
        throw new Error('Missing required fields.');
    }

    if (month < 1 || month > 12) {
        throw new Error('Month should be between 1 and 12.');
    }

    const currentYear = new Date().getFullYear();
    const incorporationYear = parseInt(process.env.INCORPORATION_YEAR, 10);
    if (year < incorporationYear || year > currentYear) {
        throw new Error(`Year should be between ${incorporationYear} and ${currentYear}.`);
    }
};

const calculateInvoiceAmounts = (labourCost, materialCost, cisNumber) => {
    let cisRate = 0; // Default rate for VAT Registered companies

    const isRegisteredForCIS = cisNumber && cisNumber.startsWith('V'); // Check if cisNumber starts with 'V'

    // Check conditions for CIS deductions
    if (!isRegisteredForCIS) {
        cisRate = 0.3; // 30% for not verified or not provided correct name
    } else if (isRegisteredForCIS) {
        cisRate = 0.2; // 20% for CIS registered and verified
    }

    const cisAmount = parseFloat(labourCost) * cisRate;
    const grossAmount = parseFloat(labourCost) + parseFloat(materialCost);
    const netAmount = parseFloat(labourCost) - cisAmount + parseFloat(materialCost);
    const reverseCharge = grossAmount * 0.2; // Assuming reverse charge remains 20% of gross

    return {
        cisAmount,
        grossAmount,
        netAmount,
        reverseCharge
    };
};

// TODO: In the future, consider implementing a check for 'providedCorrectName' 
// to further refine the CIS deduction rate.


const updateInvoice = async (req, res) => {
    try {
        validateInvoiceData(req.body);

        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) {
            throw new Error('Invoice not found.');
        }

        const subcontractor = await Subcontractor.findByPk(invoice.SubcontractorId);
        if (!subcontractor) {
            throw new Error(`Subcontractor not found for the invoice with ID: ${req.params.id}`);
        }

        const amounts = calculateInvoiceAmounts(req.body.labourCost, req.body.materialCost, req.body.submissionDate, subcontractor.isGross);

        await Invoice.update({
            ...req.body,
            ...amounts
        }, {
            where: {
                id: req.params.id
            }
        });

        req.flash('success', 'Invoice updated.');
        return res.redirect('/admin');

    } catch (error) {
        console.error('Error updating invoice:', error.message);
        req.flash('error', `Error updating invoice with ID: ${req.params.id}. Details: ${error.message}`);
        return res.redirect('/admin');
    }
};

const deleteUser = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete users.');
        }

        const userId = req.params.id; // Get userId from request parameters

        // Check if the user is trying to delete their own account
        if (req.session.user.id === userId) {
            return res.status(403).send('Access denied. You cannot delete your own account.');
        }

        const user = await User.findByPk(req.params.id);

        if (!user) {
            // res.status(404).send('User not found');
            return req.flash('error', 'User not found');
        }

        await user.destroy();

        req.flash('success', 'User deleted successfully');
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    }
};

const deleteSubcontractor = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete subcontractors.');
        }

        const subcontractor = await Subcontractor.findByPk(req.params.id);

        if (!subcontractor) {
            // res.status(404).send('Subcontractor not found');
            return req.flash('error', 'Subcontractor not found');
        }

        await subcontractor.destroy();

        req.flash('success', 'Subcontractor deleted successfully');
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    }
};

// Delete an invoice
const deleteInvoice = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied. Only admins can delete invoices.');
        }

        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            // res.status(404).send('Invoice not found');
            return req.flash('error', 'Invoice not found');
        }

        await invoice.destroy();

        req.flash('success', 'Invoice deleted successfully');
        const referrer = req.get('referer') || '/admin';
        res.redirect(referrer);
    } catch (error) {
        req.flash('error', 'Error: ' + error.message);
        const referrer = req.header('Referer') || '/';
        res.redirect(referrer);
    }
};

module.exports = {
    renderAdminDashboard,
    renderUserCreateForm,
    createUser,
    viewUser,
    renderSubcontractorCreateForm,
    createSubcontractor,
    viewSubcontractor,
    viewInvoice,
    renderUserEditForm,
    updateUser,
    renderSubcontractorEditForm,
    updateSubcontractor,
    renderInvoiceEditForm,
    updateInvoice,
    deleteUser,
    deleteSubcontractor,
    deleteInvoice,
};