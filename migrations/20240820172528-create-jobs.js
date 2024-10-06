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
      jobRef: {
        type: STRING,
        allowNull: false,
        unique: true
      },
      location: {
        type: STRING,
        allowNull: false
      },
      startDate: {
        type: DATE,
        allowNull: true
      },
      endDate: {
        type: DATE,
        allowNull: true
      },
      value: {
        type: FLOAT,
        allowNull: false
      },
      status: {
        type: ENUM('assigned', 'in_progress', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'assigned'
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
      archivedAt: {
        type: DATE,
        allowNull: true
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Jobs');
  }
};
