'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('KF_receipts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      InvoiceDBID: Sequelize.INTEGER,
      InvoiceNumber: Sequelize.INTEGER,
      InvoiceDate: Sequelize.DATE,
      DueDate: Sequelize.DATE,
      Customer: Sequelize.STRING,
      CustomerID: Sequelize.INTEGER,
      Paid: Sequelize.FLOAT,
      CustomerReference: Sequelize.STRING,
      EstimateCategory: Sequelize.STRING,
      SuppressTotal: Sequelize.INTEGER,
      ProjectID: Sequelize.INTEGER,
      CurrencyCode: Sequelize.STRING,
      ExchangeRate: Sequelize.FLOAT,
      NetAmount: Sequelize.FLOAT,
      VATAmount: Sequelize.FLOAT,
      AmountPaid: Sequelize.FLOAT,
      CustomerName: Sequelize.STRING,
      PermaLink: Sequelize.STRING,
      DeliveryAddress: Sequelize.JSON,
      UseCustomDeliveryAddress: Sequelize.BOOLEAN,
      CISRCNetAmount: Sequelize.FLOAT,
      CISRCVatAmount: Sequelize.FLOAT,
      IsCISReverseCharge: Sequelize.BOOLEAN,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('KF_receipts');
  },
};
