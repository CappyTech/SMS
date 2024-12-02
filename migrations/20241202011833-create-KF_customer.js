'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('KF_customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      CustomerID: Sequelize.INTEGER,
      Code: Sequelize.STRING,
      Name: Sequelize.STRING,
      Contact: Sequelize.STRING,
      Telephone: Sequelize.STRING,
      Mobile: Sequelize.STRING,
      Email: Sequelize.STRING,
      Address1: Sequelize.STRING,
      Address2: Sequelize.STRING,
      Address3: Sequelize.STRING,
      Postcode: Sequelize.STRING,
      CountryName: Sequelize.STRING,
      Website: Sequelize.STRING,
      Notes: Sequelize.TEXT,
      Discount: Sequelize.FLOAT,
      Created: Sequelize.DATE,
      Updated: Sequelize.DATE,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('KF_customers');
  },
};
