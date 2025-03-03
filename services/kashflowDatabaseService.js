'use strict';

require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require('./loggerService');
const basename = path.basename(__filename);
const kf = {};

// Validate environment variables
if (!process.env.KF_DB || !process.env.KF_USER || !process.env.KF_PASS || !process.env.DB_HOST) {
    logger.error("Missing required database environment variables. Check your .env file.");
    process.exit(1);
}

// Initialize Sequelize instance with SSL & Connection Pooling
const sequelize = new Sequelize(
    process.env.KF_DB,
    process.env.KF_USER,
    process.env.KF_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        native: true,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
        },
        pool: {
            max: 10, // Max 10 connections
            min: 1,  // Min 1 connection
            acquire: 30000, // Wait 30 sec before throwing error
            idle: 10000, // Close connections idle for 10 sec
        }
    }
);

// Authenticate Sequelize
sequelize.authenticate()
    .then(() => {
        logger.info({
            event: "db_connection",
            message: "KashFlow database connection established",
            environment: process.env.NODE_ENV,
        });
    })
    .catch((error) => {
        logger.error("Unable to connect to the KashFlow database:", { message: error.message, stack: error.stack });
        process.exit(1);
    });

// Dynamically load all models
const modelsDirectory = path.join(__dirname, '../models/kf');
const modelFiles = fs.readdirSync(modelsDirectory)
    .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js');

modelFiles.forEach((file) => {
    const model = require(path.join(modelsDirectory, file))(sequelize, Sequelize.DataTypes);
    kf[model.name] = model;
});

// Invoke associate methods for models
Object.keys(kf).forEach((modelName) => {
    if (kf[modelName].associate) {
        kf[modelName].associate(kf);
    }
});

// Log model names & associations in development only
if (process.env.NODE_ENV !== 'production') {
    //logger.info("Models Loaded:", Object.keys(kf));
    Object.keys(kf).forEach((modelName) => {
        //logger.info(`Associations for ${modelName}:`, kf[modelName].associations);
    });
}

// Prevent accidental sync in production
if (process.env.NODE_ENV === 'development') {
    sequelize.sync({ alter: false })
        .then(() => logger.info('All models synchronized successfully.'))
        .catch((error) => {
            logger.error("Error synchronizing database:", { message: error.message, stack: error.stack });
            process.exit(1);
        });
} else {
    logger.warn("Sequelize sync is disabled in production for safety.");
}

kf.sequelize = sequelize;
kf.Sequelize = Sequelize;

module.exports = kf;
