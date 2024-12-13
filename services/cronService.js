const cron = require('node-cron');
const fetchKashFlowData2 = require('../kf/fetchKashFlowData2');
const logger = require('./loggerService');
const schedule = '0 6-18 * * *'; // Every hour from 6 AM to 6 PM

module.exports = (req, res, next) => {
    cron.schedule(schedule, async () => {
        try {
            logger.info('Cron job started: Fetching KashFlow data...');
            await fetchKashFlowData2.fetchKashFlowData2();
            logger.info('Cron job completed: KashFlow data fetched successfully.');
        } catch (error) {
            logger.error('Cron job failed: ' + error.message);
        }
    });
    next();
};