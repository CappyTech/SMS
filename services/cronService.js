const cron = require('node-cron');
const fetchKashFlowData = require('../kf/fetchKashFlowData');
const logger = require('./loggerService');

const schedule = '0 6-18 * * *'; // Every hour from 6 AM to 6 PM

cron.schedule(schedule, async () => {
    try {
        logger.info('Cron job started: Fetching KashFlow data...');
        await fetchKashFlowData.fetchKashFlowData();
        logger.info('Cron job completed: KashFlow data fetched successfully.');
    } catch (error) {
        logger.error('Cron job failed: ' + error.message);
    }
});