'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Jobs', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      job_ref: {  // Correcting to snake_case to match the model
        type: STRING,
        allowNull: false,
        unique: true,
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
      quoteId: {
        type: UUID,
        allowNull: true,
        references: {
          model: 'Quotes',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      value: {
        type: FLOAT,
        allowNull: true
      },
      status: {
        type: ENUM('pending', 'in_progress', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'pending'
      },
      desc: {
        type: TEXT,
        allowNull: true
      },
      completionDate: {
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
    await queryInterface.dropTable('Jobs');
  }
};
