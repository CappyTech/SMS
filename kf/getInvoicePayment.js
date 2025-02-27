const logger = require('../services/loggerService');

function getinvoicePayment(client, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const invoicePaymentParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      invoiceNumber: invoiceNumber,
    };

    client.getInvoicePayment(invoicePaymentParams, (error, result) => {
      if (error) {
        logger.error('Error calling getInvoicePayment method:', error);
        return reject(error);
      }

      // Safely handle the response structure
      const invoicePaymentResult = result?.getInvoicePaymentResult;

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