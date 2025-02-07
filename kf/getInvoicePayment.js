const logger = require('../services/loggerService');

function getinvoicePayment(client, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const invoicePaymentParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      invoiceNumber: invoiceNumber,
    };

    client.GetinvoicePayment(invoicePaymentParams, (error, result) => {
      if (error) {
        logger.error('Error calling GetinvoicePayment method:', error);
        return reject(error);
      }

      // Safely handle the response structure
      const invoicePaymentResult = result?.GetInvoicePaymentResult;

      if (invoicePaymentResult) {
        resolve(invoicePaymentResult);
      } else {
        logger.info('No payments found for the given invoice.');
        resolve([]);
      }
    });
  });
}

module.exports = getinvoicePayment;