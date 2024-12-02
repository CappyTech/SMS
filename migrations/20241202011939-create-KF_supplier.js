'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('KF_suppliers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      SupplierID: Sequelize.INTEGER,
      Code: Sequelize.STRING,
      Name: Sequelize.STRING,
      Contact: Sequelize.STRING,
      Mobile: Sequelize.STRING,
      Fax: Sequelize.STRING,
      Address1: Sequelize.STRING,
      Address2: Sequelize.STRING,
      Address3: Sequelize.STRING,
      Address4: Sequelize.STRING,
      PostCode: Sequelize.STRING,
      Telephone: Sequelize.STRING,
      Website: Sequelize.STRING,
      Email: Sequelize.STRING,
      Created: Sequelize.DATE,
      Updated: Sequelize.DATE,
      EC: Sequelize.FLOAT,
      VATNumber: Sequelize.STRING,
      Notes: Sequelize.TEXT,
      CurrencyID: Sequelize.INTEGER,
      PaymentTerms: Sequelize.INTEGER,
      ContactTitle: Sequelize.STRING,
      ContactFirstName: Sequelize.STRING,
      ContactLastName: Sequelize.STRING,
      TradeBorderType: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('KF_suppliers');
  },
};
