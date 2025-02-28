const logger = require('../services/loggerService');

function getInvoicePayment(client, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const invoicePaymentParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      InvoiceNumber: invoiceNumber,
    };

    client.GetInvoicePayment(invoicePaymentParams, (error, result) => {
      if (error) {
        logger.error('Error calling GetInvoicePayment method:', error);
        return reject(error);
      }

      // Ensure we safely access the response
      const invoicePaymentResult = result?.GetInvoicePaymentResult;
      //logger.debug('GetInvoicePayment result: ' + JSON.stringify(invoicePaymentResult, null, 2));
      if (invoicePaymentResult === null) {
        logger.info(`No payments found for Invoice #${invoiceNumber}`);
        return resolve([]);
      }
      if (!invoicePaymentResult) {
        logger.warn('Unexpected API response format for GetInvoicePayment:', result);
        return resolve([]);
      }

      // Normalize payments into an array
      const payments = Array.isArray(invoicePaymentResult)
        ? invoicePaymentResult.Payment
        : invoicePaymentResult.Payment
        ? [invoicePaymentResult.Payment]
        : [];

      if (payments.length === 0) {
        logger.info(`No payments found for Invoice #${invoiceNumber}`);
      }

      resolve(payments);
    });
  });
}

module.exports = getInvoicePayment;