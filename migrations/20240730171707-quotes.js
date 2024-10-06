'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Quotes', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      date: {
        type: DATE,
        allowNull: true,
      },
      quote_ref: {
        type: STRING,
        allowNull: true,
      },
      job_ref: {
        type: STRING,
        allowNull: true,
      },
      location: {
        type: STRING,
        allowNull: true,
      },
      client: {
        type: STRING,
        allowNull: true,
      },
      contact_ref: {
        type: STRING,
        allowNull: true,
      },
      value: {
        type: FLOAT,
        allowNull: true,
      },
      desc: {
        type: TEXT,
        allowNull: true,
      },
      invoice_no: {
        type: STRING,
        allowNull: true,
      },
      invoice_date: {
        type: DATE,
        allowNull: true,
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
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Quotes');
  },
};

