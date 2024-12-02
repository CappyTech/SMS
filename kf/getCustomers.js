function getCustomers(client) {
  return new Promise((resolve, reject) => {
    const customersParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD
    };

    client.GetCustomers(customersParams, (err, result) => {
      if (err) {
        console.error('Error calling GetCustomers method:', err);
        return reject(err);
      }

      const customers = result.GetCustomersResult.Customer;

      if (customers && customers.length) {
        console.log('Total number of customers:', customers.length);
        resolve(customers);
      } else {
        console.log('No customers found.');
        resolve([]);  // Return an empty array if no customers are found
      }
    });
  });
}

module.exports = getCustomers;