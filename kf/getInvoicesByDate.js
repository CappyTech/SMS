function getInvoicesByDate(client, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const invoicesParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      StartDate: startDate.toISOString(),
      EndDate: endDate.toISOString(),
    };

    client.GetInvoicesByDateRange(invoicesParams, async (err, result) => {
      if (err) {
        console.error('Error calling GetInvoicesByDateRange method:', err);
        return reject(err);
      }

      const invoices = result.GetInvoicesByDateRangeResult.Invoice;

      if (invoices && invoices.length) {
        console.log('Total number of invoices:', invoices.length);
        resolve(invoices);
      } else {
        console.log('No invoices found.');
        resolve([]);
      }
    });
  });
}

module.exports = getInvoicesByDate;