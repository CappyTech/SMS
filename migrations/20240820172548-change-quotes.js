'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Quotes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      quote_ref: {
        type: Sequelize.STRING,
        allowNull: true
      },
      job_ref: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      contact_ref: {
        type: Sequelize.STRING,
        allowNull: true
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      desc: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      invoice_no: {
        type: Sequelize.STRING,
        allowNull: true
      },
      invoice_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Quotes');
  }
};
