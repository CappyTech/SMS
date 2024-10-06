const cron = require('node-cron');
const logger = require('../logger');
const helpers = require('../helpers'); // Adjust the path as necessary

const oneDriveSync = () => {
    cron.schedule('0 * * * *', async () => {  // Runs every hour
        try {
            logger.info('Starting OneDrive sync...');
            await helpers.syncOneDriveToDatabase();
            logger.info('OneDrive sync completed successfully.');
        } catch (error) {
            logger.error('Error during OneDrive sync: ' + error.message);
        }
    });
};

module.exports = oneDriveSync;