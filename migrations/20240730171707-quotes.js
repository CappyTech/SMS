'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Quotes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      quote_ref: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      job_ref: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      client: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_ref: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      desc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      invoice_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_date: {
        type: Sequelize.DATE,
        allowNull: true,
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
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Quotes');
  },
};

