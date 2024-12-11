
const Users = require('../models/Users'); // Adjust the path as necessary
const logger = require('../services/loggerService');

const createDefaultAdmin = async (req, res, next) => {
    try {
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
    } catch (error) {
        logger.error('Error creating default admin: ' + error);
    }
    next();
};

module.exports = createDefaultAdmin;