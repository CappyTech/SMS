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
        logging: false,  // Set to console.log for query debugging
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
        process.exit(1);
    });

// Step 1: Dynamically load all models from the models directory
const modelsDirectory = path.join(__dirname, '../models/sequelize');

// Load model files
const modelFiles = fs
    .readdirSync(modelsDirectory)
    .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js');

// Define models (Step 1)
modelFiles.forEach((file) => {
    const model = require(path.join(modelsDirectory, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
});

// Step 2: Set up associations (after all models are defined)
modelFiles.forEach((file) => {
    const modelName = path.basename(file, '.js');
    if (db[modelName] && db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Export the database object with Sequelize instance and models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
