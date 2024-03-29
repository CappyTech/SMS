// models/quote.js

const {
    DataTypes
} = require('sequelize');
const sequelize = require('../db');

const Quote = sequelize.define('Quote', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    job_ref: {
        type: DataTypes.STRING,
        allowNull: false
    },
    site: {
        type: DataTypes.STRING,
        allowNull: false
    },
    client: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact_ref: {
        type: DataTypes.STRING
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    desc: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    invoice_no: {
        type: DataTypes.STRING
    },
    invoice_date: {
        type: DataTypes.DATE
    }
},{
    tableName: 'quotes' // table name in your database
});

module.exports = Quote;