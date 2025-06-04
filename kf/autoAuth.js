const soap = require('soap');
require('dotenv').config({ path: '../.env' });
const logger = require('../services/loggerService');

function authenticate(context = 'main thread', callback) {
  soap.createClient('https://securedwebapp.com/api/service.asmx?WSDL', (error, client) => {
    if (error) {
      logger.error(`[${context}] Error creating SOAP client: ${error}`);
      return callback(error);
    }

    logger.info(`[${context}] SOAP client created successfully.`);

    const authParams = {
      UserName: process.env.KFUSERNAME,
      Password: process.env.KFPASSWORD,
      appName: process.env.appName,
      AutoAuthKey: process.env.autoAuthKey
    };

    client.AutoAuthIP(authParams, (error, authResult) => {
      if (error) {
        logger.error(`[${context}] Error calling AutoAuthIP method: ${error}`);
        return callback(error);
      }

      if (authResult.Status === 'OK') {
        logger.info(`[${context}] AutoAuthIP successful.`);
        return callback(null, client);
      } else {
        logger.error(`[${context}] Failed to authenticate: ${authResult.StatusDetail}`);
        return callback(new Error(authResult.StatusDetail));
      }
    });
  });
}

module.exports = authenticate;
