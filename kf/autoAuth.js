const soap = require('soap');
require('dotenv').config({ path: '../.env' });
function authenticate(callback) {
  soap.createClient('https://securedwebapp.com/api/service.asmx?WSDL', (error, client) => {
    if (error) {
      console.error('Error creating SOAP client: ' + error);
      return callback(error);
    }

    console.log('SOAP client created successfully.');

    const authParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      appName: process.env.appName,
      AutoAuthKey: process.env.autoAuthKey
    };

    client.AutoAuthIP(authParams, (error, authResult) => {
      if (error) {
        console.error('Error calling AutoAuthIP method: ' + error);
        return callback(error);
      }

      if (authResult.Status === 'OK') {
        console.log('AutoAuthIP successful.');
        return callback(null, client);
      } else {
        console.error('Failed to authenticate with AutoAuthIP: ' + authResult.StatusDetail);
        return callback(new Error(authResult.StatusDetail));
      }
    });
  });
}

module.exports = authenticate;