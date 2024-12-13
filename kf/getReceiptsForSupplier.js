const logger = require('../services/loggerService');
function getReceiptsForSupplier(client, supplierID) {
  return new Promise((resolve, reject) => {
    const params = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      SupplierID: supplierID,
    };

    client.GetReceiptsForSupplier(params, (err, result) => {
      if (err) {
        logger.error(`Error calling GetReceiptsForSupplier for SupplierID ${supplierID}:`, err);
        return reject(err);
      }

      const receipts = result?.GetReceiptsForSupplierResult?.Invoice;

      if (receipts) {
        const receiptArray = Array.isArray(receipts) ? receipts : [receipts];
        logger.info(`Total number of receipts: ${receiptArray.length}, for SupplierID ${supplierID}.`);
        resolve(receiptArray);
      } else {
        logger.info(`No receipts found for SupplierID ${supplierID}.`);
        resolve([]);
      }
    });
  });
}

module.exports = getReceiptsForSupplier;
