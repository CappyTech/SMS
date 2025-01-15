const authenticate = require('../kf/autoAuth');
const connectToMongo = require('./mongoConnect');

const getCustomers = require('../kf/getCustomers');
const Customer = require('../models/mongoose/customer');

// Function to upsert customers into MongoDB
async function upsertCustomers(customers) {
  const operations = customers.map(customer => ({
    updateOne: {
      filter: { CustomerID: customer.CustomerID },
      update: { $set: customer },
      upsert: true,
    },
  }));
  console.log('Please wait for operation to finish...');
  try {
    const result = await Customer.bulkWrite(operations);
    console.log(`Customers modified: ${result.modifiedCount}`);
    console.log(`Customers upserted: ${result.upsertedCount}`);
    console.log('Operation successful');
  } catch (error) {
    console.error('Error during bulk upsert operation:', error);
  }
  console.log('Customers upserted successfully');
}

const Project = require('../models/mongoose/project');
const getProjects = require('../kf/getProjects');

// Function to upsert projects into MongoDB
async function upsertProjects(projects) {
  const operations = projects.map(project => ({
    updateOne: {
      filter: { ID: project.ID },
      update: { $set: project },
      upsert: true,
    },
  }));
  console.log('Please wait for operation to finish...');
  try {
    const result = await Project.bulkWrite(operations);
    console.log(`Projects modified: ${result.modifiedCount}`);
    console.log(`Projects upserted: ${result.upsertedCount}`);
    console.log('Operation successful');
  } catch (error) {
    console.error('Error during bulk upsert operation:', error);
  }
  console.log('Projects upserted successfully');
}

const Quote = require('../models/mongoose/quote');
const getQuotes = require('../kf/getQuotes');

async function upsertQuotes(quotes) {
  const operations = quotes.map(quote => ({
    updateOne: {
      filter: { InvoiceDBID: quote.InvoiceDBID },
      update: { $set: quote },
      upsert: true,
    },
  }));
  console.log('Please wait for operation to finish...');
  try {
    const result = await Quote.bulkWrite(operations);
    console.log(`Quotes modified: ${result.modifiedCount}`);
    console.log(`Quotes upserted: ${result.upsertedCount}`);
    console.log('Operation successful');
  } catch (error) {
    console.error('Error during bulk upsert operation:', error);
  }
  console.log('Quotes upserted successfully');
}

const Supplier = require('../models/mongoose/supplier');
const getSuppliers = require('../kf/getSuppliers');

async function upsertSuppliers(suppliers) {
  const operations = suppliers.map(supplier => ({
    updateOne: {
      filter: { SupplierID: supplier.SupplierID },
      update: { $set: supplier },
      upsert: true,
    },
  }));
  console.log('Please wait for operation to finish...');
  try {
    const result = await Supplier.bulkWrite(operations);
    console.log(`Suppliers modified: ${result.modifiedCount}`);
    console.log(`Suppliers upserted: ${result.upsertedCount}`);
    console.log('Operation successful');
  } catch (error) {
    console.error('Error during bulk upsert operation:', error);
  }
  console.log('Suppliers upserted successfully');
}

const Invoice = require('../models/mongoose/invoice');
const getInvoicesByDate = require('../kf/getInvoicesByDate');

async function upsertInvoices(invoices) {
  const operations = invoices.map(invoice => ({
    updateOne: {
      filter: { InvoiceDBID: invoice.InvoiceDBID },
      update: { $set: invoice },
      upsert: true,
    },
  }));
  console.log('Please wait for operation to finish...');
  try {
    const result = await Invoice.bulkWrite(operations);
    console.log(`Invoices modified: ${result.modifiedCount}`);
    console.log(`Invoices upserted: ${result.upsertedCount}`);
    console.log('Operation successful');
  } catch (error) {
    console.error('Error during bulk upsert operation:', error);
  }
  console.log('Invoices upserted successfully');
}

const Receipt = require('../models/mongoose/receipt');
const getReceipts = require('../kf/getReceipts');

async function upsertReceipts(receipts) {
  const operations = receipts.map(receipt => ({
    updateOne: {
      filter: { InvoiceDBID: receipt.InvoiceDBID },
      update: { $set: receipt },
      upsert: true,
    },
  }));
  console.log('Please wait for operation to finish...');
  try {
    const result = await Receipt.bulkWrite(operations);
    console.log(`Receipts modified: ${result.modifiedCount}`);
    console.log(`Receipts upserted: ${result.upsertedCount}`);
    console.log('Operation successfully');
  } catch (error) {
    console.error('Error during bulk upsert operation:', error);
  }
  console.log('Receipts upserted successfully');
}

const getReceiptsForSupplier = require('../kf/getReceiptsForSupplier');

(async () => {
  try {
    // Connect to MongoDB
    await connectToMongo();

    // Authenticate with KashFlow API
    const client = await new Promise((resolve, reject) => {
      authenticate((error, client) => {
        if (error) {
          console.error('Failed to authenticate:', error);
          return reject(error);
        }
        resolve(client);
      });
    });

    // Fetch and upsert customers
    const customers = await getCustomers(client);
    if (customers.length > 0) {
      await upsertCustomers(customers);
    } else {
      console.log('No customers to save.');
    }

    // Fetch and upsert projects
    const projects = await getProjects(client);
    if (projects.length > 0) {
      await upsertProjects(projects);
    } else {
      console.log('No projects to save.');
    }

    // Fetch and upsert quotes
    const quotes = await getQuotes(client);
    if (quotes.length > 0) {
      await upsertQuotes(quotes);
    } else {
      console.log('No projects to save.');
    }

    // Fetch and upsert suppliers
    const suppliers = await getSuppliers(client);
    if (suppliers.length > 0) {
      await upsertSuppliers(suppliers);
    } else {
      console.log('No suppliers to save.');
    }

    // Fetch and upsert invoices by date range (e.g., last month)
    const startDate = new Date('2014-01-01');
    const endDate = new Date();
    const invoices = await getInvoicesByDate(client, startDate, endDate);
    if (invoices.length > 0) {
      await upsertInvoices(invoices);
    } else {
      console.log('No invoices to save.');
    }

    // Fetch and upsert receipts
    /*
    const receipts = await getReceipts(client);
    if (receipts.length > 0) {
      await upsertReceipts(receipts);
    } else {
      console.log('No receipts to save.');
    }
    */

    // Loop through each supplier and get their receipts
    for (const supplier of suppliers) {
      console.log(`Fetching receipts for supplier: ${supplier.Name}`);
      const receipts = await getReceiptsForSupplier(client, supplier.SupplierID);
      
      if (receipts && receipts.length > 0) {
        console.log(`Receipts for supplier ${supplier.Name}:`);
        await upsertReceipts(receipts);
      } else {
        console.log(`No receipts found for supplier ${supplier.Name}.`);
      }
    }

    // Final console log after all operations are complete
    console.log("Everything is finished");

  } catch (error) {
    console.error('An error occurred:' + error);
  }
})();
