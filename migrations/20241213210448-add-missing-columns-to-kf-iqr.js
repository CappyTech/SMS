'use strict';

module.exports = {
    async up(queryInterface, DataTypes) {

        await queryInterface.changeColumn('KF_Invoices', 'UseCustomDeliveryAddress', {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
      });

      await queryInterface.changeColumn('KF_Invoices', 'IsCISReverseCharge', {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
      });

      await queryInterface.changeColumn('KF_Quotes', 'UseCustomDeliveryAddress', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    });

    await queryInterface.changeColumn('KF_Quotes', 'IsCISReverseCharge', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    });

    await queryInterface.changeColumn('KF_Receipts', 'UseCustomDeliveryAddress', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
  });

  await queryInterface.changeColumn('KF_Receipts', 'IsCISReverseCharge', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
  });
    },

    async down(queryInterface, DataTypes) {

        await queryInterface.changeColumn('KF_Invoices', 'UseCustomDeliveryAddress', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
      });

      await queryInterface.changeColumn('KF_Invoices', 'IsCISReverseCharge', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
      });

      await queryInterface.changeColumn('KF_Quotes', 'UseCustomDeliveryAddress', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    await queryInterface.changeColumn('KF_Quotes', 'IsCISReverseCharge', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

      await queryInterface.changeColumn('KF_Receipts', 'UseCustomDeliveryAddress', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    await queryInterface.changeColumn('KF_Receipts', 'IsCISReverseCharge', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
    },
};
