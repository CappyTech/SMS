'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Jobs', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      job_ref: {
        type: STRING,
        allowNull: true,
        unique: true,
      },
      locationId: {
        type: UUID,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      clientId: {
        type: UUID,
        allowNull: true,
        references: {
          model: 'Clients',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      quoteId: {
        type: UUID,
        allowNull: true,
        references: {
          model: 'Quotes',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      value: {
        type: FLOAT,
        allowNull: true,
      },
      status: {
        type: ENUM('pending', 'in_progress', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'pending',
      },
      desc: {
        type: TEXT,
        allowNull: true,
      },
      completionDate: {
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

    // Create the composite index
    await queryInterface.addIndex('Jobs', ['locationId', 'clientId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Jobs');
  }
};
