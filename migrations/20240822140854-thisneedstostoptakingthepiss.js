'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Quotes', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
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
      clientId: {
        type: UUID,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      contactId: {
        type: UUID, // This correctly references the Contacts table
        allowNull: true,
        references: {
          model: 'Contacts',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
      isAccepted: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DATE,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        type: DATE,
        allowNull: true,
      },
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Quotes');
  }
};
