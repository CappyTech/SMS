const logger = require('../services/loggerService');
function getReceiptsForSupplier(client, supplierID) {
  return new Promise((resolve, reject) => {
    const params = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      SupplierID: supplierID,
    };

    client.GetReceiptsForSupplier(params, (error, result) => {
      if (error) {
        logger.error(`Error calling GetReceiptsForSupplier for SupplierID ${supplierID}:`, error);
        return reject(error);
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
