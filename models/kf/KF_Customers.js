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
        Code: DataTypes.STRING(10),
        Name: DataTypes.STRING(255),
        Contact: DataTypes.STRING(255),
        Telephone: DataTypes.STRING(50),
        Mobile: DataTypes.STRING(50),
        Fax: DataTypes.STRING(50),
        Email: DataTypes.STRING(255),
        Address1: DataTypes.TEXT,
        Address2: DataTypes.TEXT,
        Address3: DataTypes.TEXT,
        Address4: DataTypes.TEXT,
        Postcode: DataTypes.STRING(50),
        CountryName: DataTypes.STRING(100),
        CountryCode: DataTypes.STRING(10),
        Website: DataTypes.STRING(255),
        Notes: DataTypes.TEXT,
        Discount: DataTypes.DECIMAL(10, 2),
        EC: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        OutsideEC: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        Source: DataTypes.INTEGER,
        ShowDiscount: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        PaymentTerms: DataTypes.INTEGER,
        CurrencyID: DataTypes.INTEGER,
        ContactTitle: DataTypes.TEXT,
        ContactFirstName: DataTypes.STRING(100),
        ContactLastName: DataTypes.STRING(100),
        CustHasDeliveryAddress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            get() {
                return this.getDataValue('CustHasDeliveryAddress') === 1;
            },
            set(value) {
                this.setDataValue('CustHasDeliveryAddress', value ? 1 : 0);
            },
        },
        DeliveryAddress1: DataTypes.TEXT,
        DeliveryAddress2: DataTypes.TEXT,
        DeliveryAddress3: DataTypes.TEXT,
        DeliveryAddress4: DataTypes.TEXT,
        DeliveryCountryName: DataTypes.STRING(100),
        DeliveryCountryCode: DataTypes.STRING(6),
        DeliveryPostcode: DataTypes.STRING(8),
        VATNumber: DataTypes.STRING(100),
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

    for (let i = 1; i <= 20; i++) {
        KF_Customers[`ExtraText${i}`] = {
            type: DataTypes.TEXT,
            defaultValue: "",
            allowNull: false,
        }
    }
    for (let i = 1; i <= 20; i++) {
        KF_Customers[`CheckBox${i}`] = {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        };
    }

    return KF_Customers;
};
