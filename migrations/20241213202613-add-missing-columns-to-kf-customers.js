const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('KF_Customers', 'Address1', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('KF_Customers', 'Address2', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('KF_Customers', 'Address3', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('KF_Customers', 'Address4', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('KF_Customers', 'Notes', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('KF_Customers', 'DeliveryAddress1', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('KF_Customers', 'DeliveryAddress2', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('KF_Customers', 'DeliveryAddress3', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
    await queryInterface.changeColumn('KF_Customers', 'DeliveryAddress4', {
        type: DataTypes.TEXT,
        allowNull: true,
    });

    await queryInterface.changeColumn('KF_Customers', 'Postcode', {
        type: DataTypes.STRING(50),
        allowNull: true,
    });

    await queryInterface.changeColumn('KF_Customers', 'CountryName', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });

    await queryInterface.changeColumn('KF_Customers', 'CountryCode', {
        type: DataTypes.STRING(10),
        allowNull: true,
    });

    await queryInterface.changeColumn('KF_Customers', 'VATNumber', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });

    await queryInterface.changeColumn('KF_Customers', 'Website', {
        type: DataTypes.STRING(255),
        allowNull: true,
    });

    await queryInterface.changeColumn('KF_Customers', 'ContactTitle', {
        type: DataTypes.STRING(50),
        allowNull: true,
    });

    await queryInterface.changeColumn('KF_Customers', 'ContactFirstName', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });

    await queryInterface.changeColumn('KF_Customers', 'ContactLastName', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });
},
    down: async (queryInterface) => {
        const columnsToRemove = [
            'Fax', 'Address4', 'CountryCode', 'EC', 'OutsideEC', 'Source', 'ShowDiscount', 'PaymentTerms',
            'CurrencyID', 'ContactTitle', 'ContactFirstName', 'ContactLastName', 'CustHasDeliveryAddress',
            'DeliveryAddress1', 'DeliveryAddress2', 'DeliveryAddress3', 'DeliveryAddress4',
            'DeliveryCountryName', 'DeliveryCountryCode', 'DeliveryPostcode', 'VATNumber',
        ];
        for (const column of columnsToRemove) {
            await queryInterface.removeColumn('KF_Customers', column);
        }
        for (let i = 1; i <= 20; i++) {
            await queryInterface.removeColumn('KF_Customers', `ExtraText${i}`);
            await queryInterface.removeColumn('KF_Customers', `CheckBox${i}`);
        }
    },
};
