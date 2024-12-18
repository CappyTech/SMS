// models/subcontractor.js
const logger = require('../../services/loggerService');
module.exports = (sequelize, DataTypes) => {
    const Subcontractors = sequelize.define('Subcontractors', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        line1: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        line2: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        county: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        postalCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        cisNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        utrNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        deduction: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        vatNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        isGross: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isCIS: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isReverseCharge: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        SupplierID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: db.KF_Suppliers,
                key: 'SupplierID',
            },
        },
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    Subcontractors.associate = (db) => {
        // Subcontractors -> Users
        db.Subcontractors.hasOne(db.Users, { foreignKey: 'subcontractorId' });

        // Subcontractors -> Invoices
        db.Subcontractors.hasMany(db.Invoices, {
            foreignKey: 'subcontractorId',
            allowNull: false,
            as: 'invoices',
        });
        db.Invoices.belongsTo(db.Subcontractors, { foreignKey: 'subcontractorId', allowNull: false });

        // Subcontractors -> Attendances
        db.Subcontractors.hasMany(db.Attendances, { foreignKey: 'subcontractorId', allowNull: false });
        db.Attendance.belongsTo(db.Subcontractors, { foreignKey: 'subcontractorId', allowNull: false });
    };

    Subcontractors.beforeValidate((subcontractor, options) => {
        logger.info('Before validate: ' + JSON.stringify(subcontractor, null, 2) + ' ' + JSON.stringify(options, null, 2));
    });

    return Subcontractors;
};