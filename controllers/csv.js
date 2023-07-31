// controllers/csv.js

const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const Invoice = require('./models/invoice');

const importDataFromCSV = async (filePath) => {
    try {
        const invoices = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                invoices.push(row);
            })
            .on('end', async () => {
                // Map each row from the CSV to an Invoice instance
                const invoiceInstances = invoices.map((row) => ({
                    invoiceNumber: row.invoiceNumber,
                    kashflowNumber: row.kashflowNumber,
                    invoiceDate: row.invoiceDate,
                    remittanceDate: row.remittanceDate,
                    grossAmount: row.grossAmount,
                    labourCost: row.labourCost,
                    materialCost: row.materialCost,
                    cisAmount: row.cisAmount,
                    netAmount: row.netAmount,
                    submissionDate: row.submissionDate,
                    reverseCharge: row.reverseCharge,
                }));

                await Invoice.bulkCreate(invoiceInstances);
                console.log('Data imported successfully!');
            });
    } catch (error) {
        console.error('Error importing data from CSV:', error);
    }
};

const exportDataToCSV = async () => {
    try {
        // Retrieve all invoices from the database
        const invoices = await Invoice.findAll({
            raw: true
        });

        // Define the headers for the CSV file
        const csvHeaders = [{
                id: 'id',
                title: 'ID'
            },
            {
                id: 'invoiceNumber',
                title: 'Invoice Number'
            },
            {
                id: 'kashflowNumber',
                title: 'Kashflow Number'
            },
            {
                id: 'invoiceDate',
                title: 'Invoice Date'
            },
            {
                id: 'remittanceDate',
                title: 'Remittance Date'
            },
            {
                id: 'grossAmount',
                title: 'Gross Amount'
            },
            {
                id: 'labourCost',
                title: 'Labour Cost'
            },
            {
                id: 'materialCost',
                title: 'Material Cost'
            },
            {
                id: 'cisAmount',
                title: 'CIS Amount'
            },
            {
                id: 'netAmount',
                title: 'Net Amount'
            },
            {
                id: 'submissionDate',
                title: 'Submission Date'
            },
            {
                id: 'reverseCharge',
                title: 'Reverse Charge'
            },
        ];

        // Define the path to the CSV file
        const filePath = path.join(__dirname, '../temp', 'invoices.csv');

        // Create a new CSV writer
        const csvWriter = createCsvWriter({
            path: filePath,
            header: csvHeaders,
        });

        // Write the data to the CSV file
        await csvWriter.writeRecords(invoices);

        // Read the CSV file content
        const csvData = fs.readFileSync(filePath, 'utf8');

        // Remove the temporary CSV file
        fs.unlinkSync(filePath);

        return csvData;
    } catch (error) {
        console.error('Error exporting data to CSV:', error);
        throw error;
    }
};

module.exports = {
    importDataFromCSV,
    exportDataToCSV
};