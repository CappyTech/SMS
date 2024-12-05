module.exports = (sequelize, DataTypes) => {
    const KF_Customers = sequelize.define('KF_Customers', {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false,
        },
        Code: DataTypes.STRING,
        Name: DataTypes.STRING,
        Contact: DataTypes.STRING,
        Telephone: DataTypes.STRING,
        Mobile: DataTypes.STRING,
        Email: DataTypes.STRING,
        Address1: DataTypes.STRING,
        Address2: DataTypes.STRING,
        Address3: DataTypes.STRING,
        Postcode: DataTypes.STRING,
        CountryName: DataTypes.STRING,
        Website: DataTypes.STRING,
        Notes: DataTypes.TEXT,
        Discount: DataTypes.DECIMAL(10, 2),
        Created: DataTypes.DATE,
        Updated: DataTypes.DATE,
    }, {
        tableName: 'KF_Customers',
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    KF_Customers.associate = (models) => {
        KF_Customers.hasMany(models.KF_Invoices, { foreignKey: 'CustomerID', as: 'invoices' });
        KF_Customers.hasMany(models.KF_Quotes, { foreignKey: 'CustomerID', as: 'quotes' });
        KF_Customers.hasMany(models.KF_Receipts, { foreignKey: 'CustomerID', as: 'receipts' });
        KF_Customers.hasMany(models.KF_Projects, { foreignKey: 'CustomerID', as: 'projects' });
    };

    return KF_Customers;
};
