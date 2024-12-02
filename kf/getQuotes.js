function getQuotes(client) {
  return new Promise((resolve, reject) => {
    const quotesParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD
    };

    client.GetQuotes(quotesParams, async (err, result) => {
      if (err) {
        console.error('Error calling GetQuotes method:', err);
        return reject(err);
      }

      const quotes = result.GetQuotesResult.Invoice;

      if (quotes && quotes.length) {
        console.log('Total number of quotes:', quotes.length);
        resolve(quotes);
      } else {
        console.log('No quotes found.');
        resolve([]);
      }
    });
  });
}

module.exports = getQuotes;