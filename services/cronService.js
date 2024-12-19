const cron = require('node-cron');
require('dotenv').config();
const fetchKF = require('../kf/fetchKashFlowData');
const taxService = require('../services/taxService');
const logger = require('./loggerService');

let scheduleKashFlowData;
let scheduleBankHoliday;

if (process.env.NODE_ENV === "production") {
    scheduleKashFlowData = '0 6-18 * * *'; // Every hour from 6 AM to 6 PM
} else {
    scheduleKashFlowData = '0 * * * *'; // Every hour
}

if (process.env.NODE_ENV === "production") {
    scheduleKashFlowData = '30 6-18 * * *'; // Every hour from 6 AM to 6 PM
} else {
    scheduleKashFlowData = '30 * * * *'; // Every hour
}

scheduleBankHoliday = '0 0 * * *'; // At midnight every day

module.exports = (req, res, next) => {
    cron.schedule(scheduleKashFlowData, async () => {
        try {
            logger.info('Cron job started: Fetching KashFlow data...');
            await fetchKF.fetchKashFlowData();
            logger.info('Cron job completed: KashFlow data fetched successfully.');
        } catch (error) {
            logger.error('Cron job (fetchKashFlowData) failed: ' + error.message);
        }
    });
    cron.schedule(scheduleBankHoliday, async () => {
        try {
            logger.info('Cron job started: Fetching Bank Holiday data...');
            await taxService.getBankHoliday();
            logger.info('Cron job completed: Bank Holiday fetched successfully.');
        } catch (error) {
            logger.error('Cron job (getBankHoliday) failed: ' + error.message);
        }
    })
    next();
};