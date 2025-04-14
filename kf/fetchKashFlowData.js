// fetchKashFlowData.js
const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const authenticate = require('./autoAuth');
const db = require('../services/kashflowDatabaseService');
const getCustomers = require('./getCustomers');
const getProjects = require('./getProjects');
const getQuotes = require('./getQuotes');
const getSuppliers = require('./getSuppliers');
const getInvoicesByDate = require('./getInvoicesByDate');
const getInvoicePayment = require('./getInvoicePayment');
const getInvoiceNotes = require('./getInvoiceNotes');
const logger = require('../services/loggerService');
const ChargeTypes = require('../controllers/CRUD/kashflow/chargeTypes.json');
const upsertData = require('./upsertData'); // Assuming extracted from main file

let isFetching = false;
let dbPingInterval = null;

exports.fetchKashFlowData = async (sendUpdate = () => {}) => {
    if (isFetching) return;
    isFetching = true;
    // 🟢 Start DB keepalive only while fetching
    dbPingInterval = setInterval(() => {
        db.sequelize.query('SELECT 1').catch(() => {});
    }, 60000);
    const startfetch = Date.now();
    const operationLog = [];

    try {
        const client = await new Promise((resolve, reject) => {
            authenticate((err, c) => err ? reject(err) : resolve(c));
        });

        const KF_Meta = db.KF_Meta;

        const baseModels = [
            { name: 'customers', fetchFn: getCustomers, model: db.KF_Customers, uniqueKey: 'CustomerID' },
            { name: 'supplier', fetchFn: getSuppliers, model: db.KF_Suppliers, uniqueKey: 'SupplierID' },
        ];

        for (const { name, fetchFn, model, uniqueKey } of baseModels) {
            const data = await fetchFn(client);
            if (data.length > 0) {
                await upsertData(model, data, uniqueKey, KF_Meta, operationLog, `./logs/${name}.txt`, sendUpdate, startfetch);
            }
        }

        const [completed, active, archived] = await Promise.all([
            getProjects(client, 0), getProjects(client, 1), getProjects(client, 2)
        ]);
        const projects = [...completed, ...active, ...archived];
        if (projects.length > 0) {
            await upsertData(db.KF_Projects, projects, 'ID', KF_Meta, operationLog, './logs/projects.txt', sendUpdate, startfetch);
        }

        const invoices = await getInvoicesByDate(client, new Date('2014-01-01'), new Date());
        const invoiceTransformed = await Promise.all(invoices.map(async invoice => {
            const payments = await getInvoicePayment(client, invoice.InvoiceNumber);
            const mappedLines = invoice.Lines?.anyType?.map(mapLine) || [];
            return { ...invoice, mappedLines, payments };
        }));
        await upsertData(db.KF_Invoices, invoiceTransformed, 'InvoiceDBID', KF_Meta, operationLog, './logs/invoices.txt', sendUpdate, startfetch);

        const quotes = await getQuotes(client);
        const quoteTransformed = await Promise.all(quotes.map(async quote => {
            const payments = await getInvoicePayment(client, quote.InvoiceNumber);
            const notes = await getInvoiceNotes(client, quote.InvoiceDBID);
            const mappedLines = quote.Lines?.anyType?.map(mapLine) || [];
            return { ...quote, mappedLines, payments, notes };
        }));
        await upsertData(db.KF_Quotes, quoteTransformed, 'InvoiceDBID', KF_Meta, operationLog, './logs/quotes.txt', sendUpdate, startfetch);

        const suppliers = await db.KF_Suppliers.findAll({ raw: true });

        await Promise.all(suppliers.map(supplier => new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'workerProcessReceipts.js'), {
                workerData: { supplier }
            });

            worker.on('message', async (msg) => {
                if (msg.type === 'done') {
                    await upsertData(
                        db.KF_Receipts,
                        msg.result,
                        'InvoiceDBID',
                        KF_Meta,
                        operationLog,
                        './logs/receipts.txt',
                        sendUpdate,
                        startfetch
                    );
                    resolve();
                } else if (msg.type === 'error') {
                    logger.error(`Worker error for ${supplier.Name}: ${msg.message}`);
                    reject(new Error(msg.message));
                }
            });

            worker.on('error', reject);
            worker.on('exit', code => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        })));

        logger.info('Data fetch and upsert completed.');
        const logFilename = `fetch-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        await fs.promises.writeFile(path.join(__dirname, '../logs', logFilename), JSON.stringify(operationLog, null, 2));

    } catch (err) {
        logger.error(`Fetch error: ${err.message}`);
    } finally {
        isFetching = false;
        
        // 🔴 Stop DB keepalive
        if (dbPingInterval) clearInterval(dbPingInterval);
        dbPingInterval = null;
    }
};

function mapLine(line) {
    return {
        LineID: line.LineID,
        Quantity: line.Quantity || null,
        Description: line.Description || null,
        Rate: line.Rate || null,
        ChargeType: line.ChargeType || null,
        ChargeTypeName: line.ChargeType ? ChargeTypes[line.ChargeType] || null : null,
        VatRate: line.VatRate || null,
        VatAmount: line.VatAmount || null,
        ProductID: line.ProductID || null,
        Sort: line.Sort || null,
        ProjID: line.ProjID || null,
    };
}
