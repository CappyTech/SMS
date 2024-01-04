// db.js
require('dotenv').config();
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.DEBUG ? console.log : false,
});

sequelize
    .authenticate()
    .then(() => {
        if (process.env.DEBUG) {
            console.log('Database connection has been established successfully.');
        }
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error);
    });

module.exports = sequelize;