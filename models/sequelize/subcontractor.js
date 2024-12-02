// models/subcontractor.js
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
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    Subcontractors.beforeValidate((subcontractor, options) => {
        logger.info('Before validate: ' + subcontractor + ' ' + options);
    });

    return Subcontractors;
};