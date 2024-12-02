function getReceipts(client) {
  return new Promise((resolve, reject) => {
    const receiptsParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD
    };

    client.GetReceipts(receiptsParams, async (err, result) => {
      if (err) {
        console.error('Error calling GetReceipts method:', err);
        return reject(err);
      }

      const receipts = result.GetReceiptsResult.Invoice;

      if (receipts && receipts.length) {
        console.log('Total number of receipts:', receipts.length);

        resolve(receipts);
      } else {
        console.log('No receipts found.');
        resolve([]);
      }
    });
  });
}

module.exports = getReceipts;