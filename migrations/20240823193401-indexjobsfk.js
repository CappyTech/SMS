'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      job_ref: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      locationId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Clients',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      quoteId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Quotes',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'pending',
      },
      desc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      completionDate: {
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

    // Create the composite index
    await queryInterface.addIndex('Jobs', ['locationId', 'clientId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Jobs');
  }
};
