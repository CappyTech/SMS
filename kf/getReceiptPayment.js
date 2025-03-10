const logger = require('../services/loggerService');

function getReceiptPayment(client, receiptNumber) {
  return new Promise((resolve, reject) => {
    const receiptPaymentParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      ReceiptNumber: receiptNumber,
    };

    client.GetReceiptPayment(receiptPaymentParams, (error, result) => {
      if (error) {
        logger.error('Error calling GetReceiptPayment method: '+ error);
        return reject(error);
      }

      // Safely handle the response structure
      const receiptPaymentResult = result?.GetReceiptPaymentResult;

      if (receiptPaymentResult) {
        resolve(receiptPaymentResult);
      } else {
        logger.info('No payments found for the given receipt.');
        resolve([]);
      }
    });
  });
}

module.exports = getReceiptPayment;