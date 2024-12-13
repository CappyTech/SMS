const logger = require('../services/loggerService');
function getQuotes(client) {
  return new Promise((resolve, reject) => {
    const quotesParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD
    };

    client.GetQuotes(quotesParams, async (err, result) => {
      if (err) {
        logger.error('Error calling GetQuotes method:', err);
        return reject(err);
      }

      const quotes = result.GetQuotesResult.Invoice;

      if (quotes && quotes.length) {
        logger.info('Total number of quotes: '+ quotes.length);
        resolve(quotes);
      } else {
        logger.info('No quotes found.');
        resolve([]);
      }
    });
  });
}

module.exports = getQuotes;