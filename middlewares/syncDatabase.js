
const sequelize = require('dbConnection');
const Users = require('../models/Users');
const logger = require('../services/loggerService');

const syncDatabase = async (req, res, next) => {
    try {
        // Check for existing tables
        const tables = await sequelize.getQueryInterface().showAllTables();
        if (tables.length === 0) {
            logger.info('The database has no tables.');
            await sequelize.sync();
            logger.info('All models synchronized.');
            const admin = await Users.findOne({
                where: {
                    [db.Sequelize.Op.or]: [
                        { username: 'admin' },
                        { role: 'admin' }
                    ]
                }
            });
            if (!admin) {
                await Users.create({
                    username: process.env.ADMIN_USERNAME,
                    email: process.env.ADMIN_EMAIL,
                    password: process.env.ADMIN_PASSWORD,
                    role: 'admin',
                }, {
                    fields: ['username', 'email', 'password', 'role']
                });
                if (process.env.DEBUG) {
                    logger.info('Default admin created.');
                }
            } else {
                if (process.env.DEBUG) {
                    logger.info('Default admin already exists.');
                }
            }
        } else {
            logger.info(`The database has the following tables: ${tables.join(', ')}`);
        }
    } catch (error) {
        logger.error('Error fetching tables / syncing: ' + error);
    }
    next();
};

module.exports = syncDatabase;