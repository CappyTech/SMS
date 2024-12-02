const soap = require('soap');
require('dotenv').config({ path: '../.env' });

const username = process.env.KFUSERNAME;
const password = process.env.KFPASSWORD;
const autoAuthKey = process.env.autoAuthKey;
const appName = process.env.appName;

// The WSDL URL for the KashFlow API
const wsdlUrl = 'https://securedwebapp.com/api/service.asmx?WSDL';

// Create SOAP client and call the AutoAuthIP method first
soap.createClient(wsdlUrl, (err, client) => {
  if (err) {
    console.error('Error creating SOAP client:', err);
    return;
  }

  console.log('SOAP client created successfully.');

  // Prepare the parameters for the AutoAuthIP call
  const authParams = {
    UserName: username,
    Password: password,
    appName: appName,
    AutoAuthKey: autoAuthKey
  };

  // Call the AutoAuthIP method to authenticate
  client.AutoAuthIP(authParams, (err, authResult) => {
    if (err) {
      console.error('Error calling AutoAuthIP method:', err);
      return;
    }

    console.log('AutoAuthIP Result:', authResult);

    // If AutoAuthIP is successful, proceed to call GetCustomers
    if (authResult && authResult.Status === 'OK') {
      console.log('AutoAuthIP successful, proceeding to GetCustomers.');

      // Prepare the parameters for GetCustomers call
      const customersParams = {
        UserName: username,
        Password: password
      };

      // Call GetCustomers to retrieve the list of customers
      client.GetCustomers(customersParams, (err, result) => {
        if (err) {
          console.error('Error calling GetCustomers method:', err);
        } else {
          console.log('Customers retrieved successfully:');
          const customers = result.GetCustomersResult.Customer;

          if (customers && customers.length) {
            // Log the total number of customers
            console.log('Total number of customers:', customers.length);

            // Iterate through all the customers and log their details
            customers.forEach((customer, index) => {
              console.log(`Customer ${index + 1}:`);
              console.log(`CustomerCode: ${customer.Code}`);
              console.log(`CustomerName: ${customer.Name}`);
              console.log('---------------------');
            });
          } else {
            console.log('No customers found.');
          }
        }
      });
    } else {
      console.log('Failed to authenticate with AutoAuthIP:', authResult.StatusDetail);
    }
  });
});
