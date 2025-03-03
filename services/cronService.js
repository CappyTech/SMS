const cron = require('node-cron');
require('dotenv').config();
const fetchKF = require('../kf/fetchKashFlowData');
const holidayService = require('../services/holidayService');
const logger = require('./loggerService');

// Generate a random valid minute for cron jobs
const getRandomMinute = () => {
    const minute = Math.floor(Math.random() * 60);
    return minute >= 0 && minute < 60 ? minute : 0; // Ensure valid minute
};

// Prevent duplicate execution
let isFetchingKashFlow = false;
let isFetchingBankHolidays = false;
let cronJobsInitialized = false;

// Function to initialize cron jobs (called once on app start)
const initializeCronJobs = () => {
    if (cronJobsInitialized) {
        logger.warn("Cron jobs are already initialized.");
        return;
    }
    cronJobsInitialized = true;

    // Schedule KashFlow job with a random minute each hour (6 AM - 6 PM)
    cron.schedule(`${getRandomMinute()} 6-18 * * *`, async () => {
        if (isFetchingKashFlow) {
            logger.warn("Skipping job: fetchKashFlowData already running.");
            return;
        }
        isFetchingKashFlow = true;
        try {
            logger.info("Cron job started: Fetching KashFlow data...");
            await fetchKF.fetchKashFlowData();
            logger.info("Cron job completed: KashFlow data fetched successfully.");
        } catch (error) {
            logger.error(`Cron job (fetchKashFlowData) failed: ${error.message}\nStack: ${error.stack}`);
        }
        isFetchingKashFlow = false;
    });

    // Schedule Bank Holiday job at midnight
    cron.schedule('0 0 * * *', async () => {
        if (isFetchingBankHolidays) {
            logger.warn("Skipping job: getBankHoliday already running.");
            return;
        }
        isFetchingBankHolidays = true;
        try {
            logger.info("Cron job started: Fetching Bank Holiday data...");
            const bankHolidays = await holidayService.getBankHoliday();
            if (!bankHolidays || bankHolidays.length === 0) {
                logger.warn("Cron job (getBankHoliday) executed but no new data was fetched.");
            } else {
                logger.info("Cron job completed: Bank Holiday data fetched successfully.");
            }
        } catch (error) {
            logger.error(`Cron job (getBankHoliday) failed: ${error.message}\nStack: ${error.stack}`);
        }
        isFetchingBankHolidays = false;
    });

    logger.info("Cron jobs initialized successfully.");
};

// Start cron jobs once when the app starts
initializeCronJobs();

module.exports = initializeCronJobs;
