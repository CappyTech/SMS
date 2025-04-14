(async () => {
    const supplier = workerData.supplier;
    const startfetch = workerData.startfetch;
    let db; // <-- declare outside so we can close it later
  
    try {
      await workerDebugLog(supplier.Name, `📦 Starting processing for supplier: ${supplier.Name} (${supplier.SupplierID})`);
  
      const client = await new Promise((resolve, reject) => {
        authenticate((err, client) => {
          if (err) return reject(err);
          resolve(client);
        });
      });
  
      const receipts = await getReceiptsForSupplier(client, supplier.SupplierID);
      await workerDebugLog(supplier.Name, { step: 'Fetched receipts', receipts });
  
      const transformedReceipts = await Promise.all(receipts.map(async (receipt) => {
        const payments = await getReceiptPayment(client, receipt.InvoiceNumber);
        const notes = await getReceiptNotes(client, receipt.InvoiceDBID);
        const mappedLines = receipt.Lines?.anyType?.map(mapLine) || [];
  
        let taxYear, taxMonth;
        if (payments?.Payment?.[0]?.PayDate) {
          ({ taxYear, taxMonth } = taxService.calculateTaxYearAndMonth(payments.Payment[0].PayDate));
        }
  
        const transformed = {
          ...receipt,
          mappedLines,
          payments,
          TaxMonth: taxMonth,
          TaxYear: taxYear,
          notes,
        };
  
        await workerDebugLog(supplier.Name, { step: `Transformed Receipt ${receipt.InvoiceNumber}`, transformed });
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
      parentPort.postMessage(`✅ Finished processing receipts for supplier: ${supplier.Name}`);
    } catch (err) {
      const errMsg = `❌ Error processing receipts for ${supplier.Name}: ${err.message}`;
      await workerDebugLog(supplier.Name, errMsg);
      parentPort.postMessage(errMsg);
    } finally {
      if (db?.sequelize?.close) {
        await db.sequelize.close(); // ✅ clean close
        await workerDebugLog(supplier.Name, `🔒 Closed DB connection for ${supplier.Name}`);
      }
    }
  })();
  