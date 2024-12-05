function getReceiptsForSupplier(client, supplierID) {
  return new Promise((resolve, reject) => {
    const params = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      SupplierID: supplierID
    };

    client.GetReceiptsForSupplier(params, (err, result) => {
      if (err) {
        console.error(`Error calling GetReceiptsForSupplier for SupplierID ${supplierID}:`, err);
        return reject(err);
      }

      // Check if the result and the Invoice field are not null
      if (result && result.GetReceiptsForSupplierResult && result.GetReceiptsForSupplierResult.Invoice) {
        const receipts = result.GetReceiptsForSupplierResult.Invoice;
        console.log(`Total number of receipts; ${result.GetReceiptsForSupplierResult.length}, for SupplierID ${supplierID}.`);
        resolve(receipts);
      } else {
        console.log(`No receipts found for SupplierID ${supplierID}.`);
        resolve([]);
      }
    });
  });
}

module.exports = getReceiptsForSupplier;