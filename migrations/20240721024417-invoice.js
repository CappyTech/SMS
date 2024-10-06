'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Invoices', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      invoiceNumber: {
        type: STRING,
        allowNull: false,
      },
      kashflowNumber: {
        type: STRING,
        allowNull: false,
        unique: true,
      },
      invoiceDate: {
        type: DATE,
        allowNull: true,
      },
      remittanceDate: {
        type: DATE,
        allowNull: true,
      },
      grossAmount: {
        type: FLOAT,
        allowNull: false,
      },
      labourCost: {
        type: FLOAT,
        allowNull: false,
      },
      materialCost: {
        type: FLOAT,
        allowNull: false,
      },
      cisAmount: {
        type: FLOAT,
        allowNull: false,
      },
      netAmount: {
        type: FLOAT,
        allowNull: false,
      },
      submissionDate: {
        type: DATE,
        allowNull: true,
      },
      reverseCharge: {
        type: FLOAT,
        allowNull: true,
      },
      month: {
        type: INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 12,
        },
      },
      year: {
        type: INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DATE,
      },
      deletedAt: {
        type: DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Invoices');
  },
};
