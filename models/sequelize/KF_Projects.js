module.exports = (sequelize, DataTypes) => {
    const KF_Projects = sequelize.define('KF_Projects', {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        ID: { // KashFlow ID
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false,
        },
        Number: DataTypes.INTEGER,
        Name: DataTypes.STRING,
        Reference: DataTypes.STRING,
        Description: DataTypes.TEXT,
        Date1: DataTypes.DATE,
        Date2: DataTypes.DATE,
        CustomerID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'KF_Customers',
                key: 'CustomerID',
            },
        },
        Status: DataTypes.INTEGER,
    }, {
        tableName: 'KF_Projects',
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    return KF_Projects;
};
