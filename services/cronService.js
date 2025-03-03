const cron = require('node-cron');
require('dotenv').config();
const fetchKF = require('../kf/fetchKashFlowData');
const holidayService = require('../services/holidayService');
const logger = require('./loggerService');

// Generate random minutes to distribute load
const getRandomMinute = () => Math.floor(Math.random() * 60);

// Schedule KashFlow job (Random minute every hour from 6 AM to 6 PM)
const scheduleKashFlowData = process.env.NODE_ENV === "production"
    ? `${getRandomMinute()} 6-18 * * *`
    : `${getRandomMinute()} * * * *`;

// Schedule Bank Holiday job (Runs once daily at midnight)
const scheduleBankHoliday = '0 0 * * *';

// Prevent duplicate execution
let isFetchingKashFlow = false;
let isFetchingBankHolidays = false;

// Function to initialize cron jobs (called once on app start)
const initializeCronJobs = () => {
    cron.schedule(scheduleKashFlowData, async () => {
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
            logger.error("Cron job (fetchKashFlowData) failed:", { message: error.message, stack: error.stack });
        }
        isFetchingKashFlow = false;
    });

    cron.schedule(scheduleBankHoliday, async () => {
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
            logger.error("Cron job (getBankHoliday) failed:", { message: error.message, stack: error.stack });
        }
        isFetchingBankHolidays = false;
    });
};

// Start cron jobs once when the app starts
initializeCronJobs();

module.exports = initializeCronJobs;
