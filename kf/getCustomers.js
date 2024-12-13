const logger = require('../services/loggerService');
function getCustomers(client) {
  return new Promise((resolve, reject) => {
    const customersParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD
    };

    client.GetCustomers(customersParams, (err, result) => {
      if (err) {
        logger.error('Error calling GetCustomers method:', err);
        return reject(err);
      }

      const customers = result.GetCustomersResult.Customer;

      if (customers && customers.length) {
        logger.info('Total number of customers: '+ customers.length);
        resolve(customers);
      } else {
        logger.log('No customers found.');
        resolve([]);
      }
    });
  });
}

module.exports = getCustomers;