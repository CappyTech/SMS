module.exports = (sequelize, DataTypes) => {
    const KF_Invoices = sequelize.define('KF_Invoices', {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        InvoiceDBID: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false,
        },
        InvoiceNumber: DataTypes.INTEGER,
        InvoiceDate: DataTypes.DATE,
        DueDate: DataTypes.DATE,
        Customer: DataTypes.STRING,
        CustomerID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'KF_Customers',
                key: 'CustomerID',
            },
        },
        Paid: DataTypes.DECIMAL(10, 2),
        CustomerReference: DataTypes.STRING,
        EstimateCategory: DataTypes.STRING,
        SuppressTotal: DataTypes.BOOLEAN,
        ProjectID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'KF_Projects',
                key: 'ID',
            },
        },
        CurrencyCode: DataTypes.STRING,
        ExchangeRate: DataTypes.DECIMAL(10, 6),
        NetAmount: DataTypes.DECIMAL(10, 2),
        VATAmount: DataTypes.DECIMAL(10, 2),
        AmountPaid: DataTypes.DECIMAL(10, 2),
        CustomerName: DataTypes.STRING,
        PermaLink: DataTypes.STRING,
        DeliveryAddress: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        UseCustomDeliveryAddress: DataTypes.BOOLEAN,
        CISRCNetAmount: DataTypes.DECIMAL(10, 2),
        CISRCVatAmount: DataTypes.DECIMAL(10, 2),
        IsCISReverseCharge: DataTypes.BOOLEAN,
        Lines: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    }, {
        tableName: 'KF_Invoices',
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    KF_Invoices.associate = (models) => {
        KF_Invoices.belongsTo(models.KF_Customers, { foreignKey: 'CustomerID', as: 'customer' });
        KF_Invoices.belongsTo(models.KF_Projects, { foreignKey: 'ProjectID', as: 'project' });
    };

    return KF_Invoices;
};
