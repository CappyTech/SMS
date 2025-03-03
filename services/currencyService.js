const logger = require('./loggerService');
const moment = require('moment');
const Intl = require('intl');

/**
 * Formats a given amount as a currency string in GBP (£).
 * 
 * @param {number} amount - The amount to format.
 * @returns {string} - The formatted currency string.
 * @throws {Error} - Throws an error if the input amount is not a number.
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        const errorMessage = 'Invalid input. Amount must be a number.';
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

/**
 * Rounds a given number up or down.
 * 
 * @param {number} amount - The number to round.
 * @param {boolean} up - If true, rounds the number up; otherwise, rounds the number down.
 * @returns {number} - The rounded number.
 */
function rounding(amount, up) {
    return up ? Math.ceil(amount) : Math.floor(amount);
}

/**
 * Retrieves income and expense data for the past 30 days from the database.
 *
 * @param {Object} db - The Sequelize database object, containing models for querying data.
 * @returns {Promise<Object>} - Returns a Promise resolving to an object containing:
 *   - dates: {Array<string>} - Array of dates in the format 'YYYY-MM-DD'.
 *   - income: {Array<number>} - Array of income values corresponding to each date.
 *   - expenses: {Array<number>} - Array of expense values corresponding to each date.
 */
const getIncomeExpenseData = async (db) => {
    try {
        const startDate = moment().subtract(30, 'days').startOf('day').toDate();
        const endDate = moment().endOf('day').toDate();

        const incomeExpenseData = { dates: [], income: [], expenses: [] };

        const incomeData = await db.KF_Invoices.findAll({
            where: {
                InvoiceDate: { [db.Sequelize.Op.between]: [startDate, endDate] },
                AmountPaid: { [db.Sequelize.Op.gt]: 0 },
            },
            attributes: [
                [db.Sequelize.fn('DATE', db.Sequelize.col('InvoiceDate')), 'date'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('AmountPaid')), 'totalIncome'],
            ],
            group: ['date'],
        });

        const expenseData = await db.KF_Receipts.findAll({
            where: {
                InvoiceDate: { [db.Sequelize.Op.between]: [startDate, endDate] },
                AmountPaid: { [db.Sequelize.Op.gt]: 0 },
            },
            attributes: [
                [db.Sequelize.fn('DATE', db.Sequelize.col('ReceiptDate')), 'date'],
                [db.Sequelize.fn('SUM', db.Sequelize.col('AmountPaid')), 'totalExpenses'],
            ],
            group: ['date'],
        });

        const dateRange = Array.from({ length: 30 }, (_, i) =>
            moment().subtract(i, 'days').format('YYYY-MM-DD')
        ).reverse();

        dateRange.forEach((date) => {
            const income = incomeData.find((entry) => entry.date === date)?.totalIncome || 0;
            const expenses = expenseData.find((entry) => entry.date === date)?.totalExpenses || 0;

            incomeExpenseData.dates.push(date);
            incomeExpenseData.income.push(parseFloat(income));
            incomeExpenseData.expenses.push(parseFloat(expenses));
        });

        return incomeExpenseData;
    } catch (error) {
        logger.error({
            event: 'getIncomeExpenseData_error',
            message: error.message,
            stack: error.stack,
        });
        throw error;
    }
};

module.exports = { formatCurrency, rounding, getIncomeExpenseData };
