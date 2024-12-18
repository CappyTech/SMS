// models/quote.js
module.exports = (sequelize, DataTypes) => {
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
    locationId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    contactId: {
        type: DataTypes.UUID,
        allowNull: true,
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
    },
    isAccepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
    },
    updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    KashFlowID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'KF_Quotes',
            key: 'InvoiceNumber',
        },
    },
}, {
    timestamps: true,
    paranoid: true,
    charset: 'latin1',
    collate: 'latin1_bin',
});

return Quotes;
};
