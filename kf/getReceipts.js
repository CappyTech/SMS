const logger = require('../services/loggerService');
function getReceipts(client) {
  return new Promise((resolve, reject) => {
    const receiptsParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD
    };

    client.GetReceipts(receiptsParams, async (error, result) => {
      if (error) {
        logger.error('Error calling GetReceipts method: '+ error);
        return reject(error);
      }

      const receipts = result.GetReceiptsResult.Invoice;

      if (receipts && receipts.length) {
        logger.info('Total number of receipts: '+ receipts.length);
        resolve(receipts);
      } else {
        logger.info('No receipts found.');
        resolve([]);
      }
    });
  });
}

module.exports = getReceipts;