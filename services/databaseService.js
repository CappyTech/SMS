// db.js
require('dotenv').config();
const Sequelize = require('sequelize');
const logger = require('./loggerService');

/**
 * Initializes a Sequelize instance with the database configuration.
 * 
 * @returns {Object} - Sequelize instance.
 */
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.DEBUG ? msg => logger.debug(msg) : false,
});

/**
 * Authenticates the Sequelize instance with the database.
 * Logs a success message if the connection is established successfully.
 * Logs an error message if the connection fails.
 */
sequelize
    .authenticate()
    .then(() => {
        if (process.env.DEBUG) {
            logger.info('Database connection has been established successfully.');
        }
    })
    .catch((error) => {
        logger.error('Unable to connect to the database: ', error.message);
        logger.error('Details:', error);
    });

module.exports = { sequelize, Sequelize };