'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Invoices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      invoiceNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      kashflowNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      invoiceDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      remittanceDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      grossAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      labourCost: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      materialCost: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      cisAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      netAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      submissionDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reverseCharge: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 12,
        },
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Invoices');
  },
};
