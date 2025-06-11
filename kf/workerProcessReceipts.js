const { parentPort, workerData, isMainThread } = require('worker_threads');
const authenticate = require('./autoAuth');
const upsertData = require('./upsertData');
const getReceiptsForSupplier = require('./getReceiptsForSupplier');
const getReceiptPayment = require('./getReceiptPayment');
const getReceiptNotes = require('./getReceiptNotes');
const taxService = require('../services/taxService');
const createDbConnection = require('../services/kashflowDatabaseService').createDbConnection;
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
const ChargeTypes = require('../controllers/CRUD/kashflow/chargeTypes.json');

if (isMainThread) {
  console.error('❌ This file should only be run as a worker.');
  process.exit(1);
}
const workerDebugLog = async (supplierName, message) => {
  try {
    parentPort.postMessage({
      type: 'log',
      supplier: supplierName,
      timestamp: new Date().toISOString(),
      log: typeof message === 'string' ? message : JSON.stringify(message, null, 2),
    });
  } catch (err) {
    console.error(`Failed to post log message from worker: ${err.message}`);
  }
};

(async () => {
    if (!workerData || !workerData.supplier) {
      console.error('❌ This script must be run as a worker with workerData.supplier');
      process.exit(1);
    }
    const supplier = workerData.supplier;
    const startfetch = workerData.startfetch;
    let db; // <-- declare outside so we can close it later
    try {
      await workerDebugLog(supplier.Name, `📦 Starting processing for supplier: ${supplier.Name} (${supplier.SupplierID})`);
  
      const context = `worker thread - working on: ${supplier.Name}`;
      const client = await authenticate(context);

  
      const receipts = await getReceiptsForSupplier(client, supplier.SupplierID);
      const receiptsLength = receipts.length;
      await workerDebugLog(supplier.Name, { step: 'Fetched receipts', receiptsLength });
  
      const transformedReceipts = await Promise.all(receipts.map(async (receipt) => {
        const payments = await getReceiptPayment(client, receipt.InvoiceNumber);
        const flattenedPayments = Array.isArray(payments?.Payment?.Payment)
            ? payments.Payment.Payment
            : payments?.Payment?.Payment ? [payments.Payment.Payment] : [];
        const notes = await getReceiptNotes(client, receipt.InvoiceDBID);
        const mappedLines = receipt.Lines?.anyType?.map(mapLine) || [];
  
        let taxYear, taxMonth;

        const paymentArray = Array.isArray(payments?.Payment)
          ? payments.Payment
          : payments?.Payment ? [payments.Payment] : [];

        if (paymentArray.length && paymentArray[0]?.PayDate) {
          ({ taxYear, taxMonth } = taxService.calculateTaxYearAndMonth(paymentArray[0].PayDate));
        }
  
        /* 🐛 Debug: Log raw receipt
        await workerDebugLog(supplier.Name, {
          step: `Inspecting raw receipt`,
          invoiceNumber: receipt.InvoiceNumber,
          receiptSummary: {
            InvoiceDBID: receipt.InvoiceDBID,
            InvoiceNumber: receipt.InvoiceNumber,
            SupplierID: receipt.SupplierID,
            Description: receipt.Description,
            Total: receipt.Total,
            Date: receipt.InvoiceDate,
          },
        });
        */

        const transformed = {
          ...receipt,
          Lines: mappedLines,
          Payments: flattenedPayments,
          TaxMonth: taxMonth,
          TaxYear: taxYear,
          notes,
        };
  
        await workerDebugLog(supplier.Name, { step: `Transformed Receipt ${receipt.InvoiceNumber}` });
        return transformed;
      }));
  
      db = createDbConnection(); // <-- assign here
      await upsertData(
        db.KF_Receipts,
        transformedReceipts,
        'InvoiceDBID',
        db.KF_Meta,
        [],
        './logs/receipts.txt',
        (msg) => parentPort.postMessage(msg),
        startfetch
      );
  
      await workerDebugLog(supplier.Name, `✅ Upserted ${transformedReceipts.length} receipts for ${supplier.Name}`);
      parentPort.postMessage({ type: 'done', result: transformedReceipts });
    } catch (err) {
      const errMsg = `❌ Error processing receipts for ${supplier.Name}: ${err.message}`;
      await workerDebugLog(supplier.Name, errMsg);
      parentPort.postMessage({ type: 'error', message: err.message });
    } finally {
      if (db?.sequelize?.close) {
        await db.sequelize.close(); // ✅ clean close
        await workerDebugLog(supplier.Name, `🔒 Closed DB connection for ${supplier.Name}`);
      }
    }
  })();
  