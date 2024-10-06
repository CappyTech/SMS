'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Quotes', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      date: {
        type: DATE,
        allowNull: true
      },
      quote_ref: {
        type: STRING,
        allowNull: true
      },
      job_ref: {
        type: STRING,
        allowNull: true
      },
      location: {
        type: STRING,
        allowNull: true
      },
      clientId: {
        type: UUID,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      contact_ref: {
        type: STRING,
        allowNull: true
      },
      value: {
        type: FLOAT,
        allowNull: true
      },
      desc: {
        type: TEXT,
        allowNull: true
      },
      invoice_no: {
        type: STRING,
        allowNull: true
      },
      invoice_date: {
        type: DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: DATE,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: DATE,
        allowNull: true
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Quotes');
  }
};
