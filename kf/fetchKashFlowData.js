const authenticate = require('./autoAuth');
const db = require('../services/sequelizeDatabaseService');
const getCustomers = require('./getCustomers');
const getProjects = require('./getProjects');
const getQuotes = require('./getQuotes');
const getSuppliers = require('./getSuppliers');
const getInvoicesByDate = require('./getInvoicesByDate');
const getReceiptsForSupplier = require('./getReceiptsForSupplier');

// Upsert function with KF_Meta table update
async function upsertData(model, data, uniqueKey, metaModel, broadcastMessage) {
    try {
        broadcastMessage('info', `Upserting data into ${model.name}...`);
        let createdCount = 0;
        let updatedCount = 0;

        for (const item of data) {
            const [instance, created] = await model.upsert(item, {
                where: { [uniqueKey]: item[uniqueKey] },
            });

            if (created) {
                createdCount++;
            } else {
                updatedCount++;
            }
        }

        await metaModel.upsert({
            model: model.name,
            createdCount,
            updatedCount,
            lastFetchedAt: new Date(),
        });

        broadcastMessage(
            'success',
            `Upsert complete for ${model.name}. Created: ${createdCount}, Updated: ${updatedCount}`
        );
    } catch (error) {
        broadcastMessage('error', `Error upserting into ${model.name}: ${error.message}`);
    }
}

let isFetching = false;

exports.fetchKashFlowData = async (broadcastMessage) => {
    if (isFetching) {
        broadcastMessage('error', 'A fetch operation is already in progress.');
        return;
    }
    try {
        isFetching = true;
        broadcastMessage('info', 'Authenticating SOAP API...');
        const client = await new Promise((resolve, reject) => {
            authenticate((err, client) => {
                if (err) {
                    broadcastMessage('error', 'Failed to authenticate: ' + err.message);
                    return reject(err);
                }
                resolve(client);
            });
        });

        broadcastMessage('success', 'SOAP API authenticated successfully.');

        const KF_Meta = db.KF_Meta;

        // Fetch and upsert customers
        broadcastMessage('info', 'Fetching customers...');
        const customers = await getCustomers(client);
        if (customers.length > 0) {
            broadcastMessage('info', `Fetched ${customers.length} customers.`);
            await upsertData(db.KF_Customers, customers, 'CustomerID', KF_Meta, broadcastMessage);
        } else {
            broadcastMessage('info', 'No customers found.');
        }

        // Fetch and upsert projects
        broadcastMessage('info', 'Fetching projects...');
        const projects = await getProjects(client);
        if (projects.length > 0) {
            broadcastMessage('info', `Fetched ${projects.length} projects.`);
            await upsertData(db.KF_Projects, projects, 'ID', KF_Meta, broadcastMessage);
        } else {
            broadcastMessage('info', 'No projects found.');
        }

        // Fetch and upsert quotes
        broadcastMessage('info', 'Fetching quotes...');
        const quotes = await getQuotes(client);
        if (quotes.length > 0) {
            broadcastMessage('info', `Fetched ${quotes.length} quotes.`);
            await upsertData(db.KF_Quotes, quotes, 'InvoiceDBID', KF_Meta, broadcastMessage);
        } else {
            broadcastMessage('info', 'No quotes found.');
        }

        // Fetch and upsert suppliers
        broadcastMessage('info', 'Fetching suppliers...');
        const suppliers = await getSuppliers(client);
        if (suppliers.length > 0) {
            broadcastMessage('info', `Fetched ${suppliers.length} suppliers.`);
            await upsertData(db.KF_Suppliers, suppliers, 'SupplierID', KF_Meta, broadcastMessage);
        } else {
            broadcastMessage('info', 'No suppliers found.');
        }

        // Fetch and upsert invoices
        const startDate = new Date('2014-01-01');
        const endDate = new Date();
        broadcastMessage('info', 'Fetching invoices...');
        const invoices = await getInvoicesByDate(client, startDate, endDate);
        if (invoices.length > 0) {
            broadcastMessage('info', `Fetched ${invoices.length} invoices.`);
            await upsertData(db.KF_Invoices, invoices, 'InvoiceDBID', KF_Meta, broadcastMessage);
        } else {
            broadcastMessage('info', 'No invoices found.');
        }

        // Fetch and upsert receipts for each supplier
        for (const supplier of suppliers) {
            broadcastMessage('info', `Fetching receipts for supplier: ${supplier.Name}...`);
            const receipts = await getReceiptsForSupplier(client, supplier.SupplierID);
            if (receipts && receipts.length > 0) {
                broadcastMessage('info', `Fetched ${receipts.length} receipts for supplier: ${supplier.Name}`);
                await upsertData(db.KF_Receipts, receipts, 'InvoiceDBID', KF_Meta, broadcastMessage);
            } else {
                broadcastMessage('info', `No receipts found for supplier: ${supplier.Name}`);
            }
        }

        broadcastMessage('success', 'Data fetch and upsert completed.');
    } catch (error) {
        broadcastMessage('error', `An error occurred during fetch: ${error.message}`);
    } finally {
        isFetching = false;
    }
};
