// models/location.js
module.exports = (sequelize, DataTypes) => {
    const Locations = sequelize.define('Locations', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        postalCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        createdAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    Locations.associate = (db) => {
        // Locations -> Jobs
        db.Locations.hasMany(db.Jobs, { foreignKey: 'locationId', allowNull: false });
        db.Jobs.belongsTo(db.Locations, { foreignKey: 'locationId', allowNull: false });

        // Locations -> Quotes
        db.Locations.hasMany(db.Quotes, { foreignKey: 'locationId', allowNull: false });
        db.Quotes.belongsTo(db.Locations, { foreignKey: 'locationId', allowNull: false });

        // Locations -> Attendances
        db.Locations.hasMany(db.Attendances, { foreignKey: 'locationId', allowNull: false });
        db.Attendances.belongsTo(db.Locations, { foreignKey: 'locationId', allowNull: false });
    };

    return Locations;
};