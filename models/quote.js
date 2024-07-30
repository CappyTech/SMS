// models/quote.js

const {
    DataTypes
} = require('sequelize');
const sequelize = require('../db.js');

const Quotes = sequelize.define('Quotes', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    quote_ref: {
        type: DataTypes.STRING,
        allowNull: true
    },
    job_ref: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    client: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contact_ref: {
        type: DataTypes.STRING,
        allowNull: true
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    desc: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    invoice_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    invoice_date: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    paranoid: true,
});

module.exports = Quotes;