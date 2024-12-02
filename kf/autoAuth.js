const soap = require('soap');
require('dotenv').config({ path: '../.env' });
function authenticate(callback) {
  soap.createClient('https://securedwebapp.com/api/service.asmx?WSDL', (err, client) => {
    if (err) {
      console.error('Error creating SOAP client: ' + err);
      return callback(err);
    }

    console.log('SOAP client created successfully.');

    const authParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      appName: process.env.appName,
      AutoAuthKey: process.env.autoAuthKey
    };

    client.AutoAuthIP(authParams, (err, authResult) => {
      if (err) {
        console.error('Error calling AutoAuthIP method: ' + err);
        return callback(err);
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