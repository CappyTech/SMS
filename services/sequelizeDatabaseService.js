'use strict';

require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require('./loggerService');
const basename = path.basename(__filename);
const db = {};

// Initialize Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
    }
);

// Authenticate Sequelize
sequelize
    .authenticate()
    .then(() => {
        if (process.env.DEBUG) {
            logger.info('MySQL Database connection has been established successfully.');
        }
    })
    .catch((error) => {
        logger.error('Unable to connect to the MySQL database: ' + error.message);
        logger.error('Details:', error);
    });

// Dynamically load all models from the models directory
const modelsDirectory = path.join(__dirname, '../models/sequelize');
fs.readdirSync(modelsDirectory)
    .filter((file) => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js' &&
            file.indexOf('.test.js') === -1
        );
    })
    .forEach((file) => {
        const model = require(path.join(modelsDirectory, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
        logger.info(`MySQL Model Loaded: ${model.name}`);
    });

// Set up model associations
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

logger.info('Loaded Sequelize models:' + Object.keys(db));

// Export the database object with Sequelize instance and models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
