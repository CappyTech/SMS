const fs = require('fs');
const path = require('path');
const authenticate = require('./autoAuth');
const db = require('../services/sequelizeDatabaseService');
const getCustomers = require('./getCustomers');
const getProjects = require('./getProjects');
const getQuotes = require('./getQuotes');
const getSuppliers = require('./getSuppliers');
const getInvoicesByDate = require('./getInvoicesByDate');
const getReceiptsForSupplier = require('./getReceiptsForSupplier');
const logger = require('../services/loggerService');

async function logOperationDetails(filename, data) {
    try {
        const filePath = path.join(__dirname, '../logs', filename);
        const logData = JSON.stringify(data, null, 2);
        await fs.promises.writeFile(filePath, logData, 'utf8');
    } catch (error) {
        logger.error(`Failed to write log file: ${error.message}`);
    }
}

async function upsertData(model, data, uniqueKey, metaModel, logDetails, logFilePath) {
    try {
        //logger.debug(`UniqueKey used for ${model.name}: ${uniqueKey}`);
        logger.info(`Upserting data into ${model.name}...`);
        let createdCount = 0;
        let updatedCount = 0;
        let checkedCount = 0;

        for (const item of data) {
            const whereClause = { [uniqueKey]: item[uniqueKey] };
            //logger.debug(`whereClause: ${JSON.stringify(whereClause)}`);

            try {
                const existing = await model.findOne({ where: whereClause, raw: false });
                //logger.debug(`Existing data for whereClause ${JSON.stringify(whereClause)}: ${JSON.stringify(existing)}`);

                if (existing) {
                    checkedCount++;
                    const changes = {};
                    let isEqual = true;

                    for (const key of Object.keys(item)) {
                        const currentValue = existing[key];
                        const newValue = item[key];

                        if (typeof newValue === 'object' && newValue !== null) {
                            if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
                                changes[key] = { from: currentValue, to: newValue };
                                isEqual = false;
                            }
                        } else if (currentValue !== newValue) {
                            changes[key] = { from: currentValue, to: newValue };
                            isEqual = false;
                        }
                    }

                    if (!isEqual) {
                        //logger.debug(`Changes detected for ${JSON.stringify(whereClause)}: ${JSON.stringify(changes)}`);
                        await model.update(item, { where: whereClause });
                        updatedCount++;
                        const logEntry = {
                            model: model.name,
                            action: 'updated',
                            uniqueKey: item[uniqueKey],
                            changes,
                        };
                        logDetails.push(logEntry);
                        await appendLogEntry(logFilePath, logEntry);
                    }
                } else {
                    //logger.debug(`No existing data found for ${JSON.stringify(whereClause)}. Creating new record.`);
                    await model.create(item);
                    createdCount++;
                    const logEntry = {
                        model: model.name,
                        action: 'created',
                        uniqueKey: item[uniqueKey],
                        item,
                    };
                    logDetails.push(logEntry);
                    await appendLogEntry(logFilePath, logEntry);
                }
            } catch (findOrUpdateError) {
                logger.error(`Error processing ${JSON.stringify(whereClause)}: ${findOrUpdateError.message}`);
            }
        }

        try {
            await metaModel.upsert({
                model: model.name,
                createdCount,
                updatedCount,
                checkedCount,
                lastFetchedAt: new Date(),
            });
            //logger.debug(`Meta data updated for ${model.name}`);
        } catch (metaError) {
            logger.error(`Error updating meta model for ${model.name}: ${metaError.message}`);
        }

        logger.info(`Upsert complete for ${model.name}. Created: ${createdCount}, Updated: ${updatedCount}, Checked: ${checkedCount}`);
    } catch (error) {
        logger.error(`Error upserting into ${model.name}: ${error.message}`);
        //logger.debug(`Full error: ${error.stack}`);
    }
}


async function appendLogEntry(logFilePath, logEntry) {
    try {
        const logData = `${new Date().toISOString()} - ${JSON.stringify(logEntry, null, 2)}\n`;
        await fs.promises.appendFile(logFilePath, logData, 'utf8');
    } catch (error) {
        logger.error(`Error writing to log file: ${error.message}`);
    }
}

let isFetching = false;

exports.fetchKashFlowData = async () => {

    if (isFetching) {
        logger.info('A fetch operation is already in progress.');
        return;
    }

    const operationLog = [];
    try {
        isFetching = true;
        isMaintenanceMode = true;
        logger.info('Maintenance mode enabled.');

        const client = await new Promise((resolve, reject) => {
            authenticate((err, client) => {
                if (err) {
                    return reject(err);
                }
                resolve(client);
            });
        });

        const KF_Meta = db.KF_Meta;

        const modelsToFetch = [
            { name: 'customers', fetchFn: getCustomers, model: db.KF_Customers, uniqueKey: 'CustomerID' },
            { name: 'projects', fetchFn: getProjects, model: db.KF_Projects, uniqueKey: 'ID' },
            { name: 'suppliers', fetchFn: getSuppliers, model: db.KF_Suppliers, uniqueKey: 'SupplierID' },
        ];

        for (const { name, fetchFn, model, uniqueKey } of modelsToFetch) {
            logger.info(`Fetching ${name.toLowerCase()}...`);
            const data = await fetchFn(client);
            if (data.length > 0) {
                logger.info(`Fetched ${data.length} ${name.toLowerCase()}.`);
                await upsertData(model, data, uniqueKey, KF_Meta, operationLog, `./logs/${name}.txt`);
            } else {
                logger.info(`No ${name.toLowerCase()} found.`);
            }
        }

        const startDate = new Date('2014-01-01');
        const endDate = new Date();

        logger.info('Fetching invoices...');
        const invoices = await getInvoicesByDate(client, startDate, endDate);
        if (invoices.length > 0) {
            logger.info(`Fetched ${invoices.length} invoices.`);
            await upsertData(
                db.KF_Invoices,
                invoices.map((invoice) => ({
                    ...invoice,
                    Lines: invoice.Lines?.anyType?.map(mapLine),
                })),
                'InvoiceDBID',
                KF_Meta,
                operationLog,
                './logs/invoices.txt'
            );
        } else {
            logger.info('No invoices found.');
        }

        logger.info('Fetching quotes...');
        const quotes = await getQuotes(client);
        if (quotes.length > 0) {
            logger.info(`Fetched ${quotes.length} quotes.`);
            await upsertData(
                db.KF_Quotes,
                quotes.map((quote) => ({
                    ...quote,
                    Lines: quote.Lines?.anyType?.map(mapLine),
                })),
                'InvoiceDBID',
                KF_Meta,
                operationLog,
                './logs/quotes.txt'
            );
        } else {
            logger.info('No quotes found.');
        }

        for (const supplier of await db.KF_Suppliers.findAll({ raw: true })) {
            try {
                logger.info(`Starting to fetch receipts for supplier: ${supplier.Name}, SupplierID: ${supplier.SupplierID}`);
        
                const receipts = await getReceiptsForSupplier(client, supplier.SupplierID);
        
                if (receipts.length > 0) {
                    logger.info(`Fetched ${receipts.length} receipts for supplier: ${supplier.Name} (SupplierID: ${supplier.SupplierID})`);
        
                    // Log raw receipts data
                    //receipts.forEach((receipt, index) => {
                        //logger.debug(`Receipt ${index + 1} for SupplierID ${supplier.SupplierID}: ${JSON.stringify(receipt, null, 2)}`);
                    //});
        
                    // Log transformed data
                    const transformedReceipts = receipts.map((receipt) => ({
                        ...receipt,
                        Lines: receipt.Lines?.anyType?.map(mapLine),
                    }));
                    //logger.debug(`Transformed receipts for SupplierID ${supplier.SupplierID}: ${JSON.stringify(transformedReceipts, null, 2)}`);
        
                    await upsertData(
                        db.KF_Receipts,
                        transformedReceipts,
                        'InvoiceDBID',
                        KF_Meta,
                        operationLog,
                        './logs/receipts.txt'
                    );
        
                    logger.info(`Successfully upserted ${receipts.length} receipts for supplier: ${supplier.Name} (SupplierID: ${supplier.SupplierID})`);
                } else {
                    logger.info(`No receipts found for supplier: ${supplier.Name} (SupplierID: ${supplier.SupplierID})`);
                }
            } catch (error) {
                logger.error(`Error processing receipts for supplier: ${supplier.Name} (SupplierID: ${supplier.SupplierID}): ${error.message}`);
            }
        }
        

        isMaintenanceMode = false;
        logger.info('Maintenance mode disabled.');
        logger.info('Data fetch and upsert completed.');

        const logFilename = `fetch-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        await logOperationDetails(logFilename, operationLog);
    } catch (error) {
        logger.error(`An error occurred during fetch: ${error.message}`);
    } finally {
        isFetching = false;
        isMaintenanceMode = false;
        logger.info('Maintenance mode disabled.');
    }
};

function mapLine(line) {
    return {
        LineID: line.LineID,
        Quantity: line.Quantity || 0,
        Description: line.Description || 'N/A',
        Rate: line.Rate || 0,
        ChargeType: line.ChargeType || 0,
        VatRate: line.VatRate || 0,
        VatAmount: line.VatAmount || 0,
        ProductID: line.ProductID || 0,
        Sort: line.Sort || 0,
        ProjID: line.ProjID || 0,
    };
}

