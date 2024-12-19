module.exports = (sequelize, DataTypes) => {
    const KF_Projects = sequelize.define('KF_Projects', {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        ID: {
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
        Value: DataTypes.DECIMAL(10, 2),
    }, {
        tableName: 'KF_Projects',
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    KF_Projects.associate = (db) => {
        KF_Projects.belongsTo(db.KF_Customers, { foreignKey: 'CustomerID', as: 'customer' });
        KF_Projects.hasMany(db.KF_Invoices, { foreignKey: 'ProjectID', as: 'invoices' });
        KF_Projects.hasMany(db.KF_Quotes, { foreignKey: 'ProjectID', as: 'quotes' });
        KF_Projects.hasMany(db.KF_Receipts, { foreignKey: 'ProjectID', as: 'receipts' });
    };

    return KF_Projects;
};
