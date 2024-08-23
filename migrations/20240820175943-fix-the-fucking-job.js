'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      job_ref: {  
        type: Sequelize.INTEGER, // Changed to INTEGER for numerical job reference
        allowNull: false,  // Job reference must always be there
        unique: true  // Ensures unique job references
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Clients', // References the Clients table
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      quoteId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Quotes', // References the Quotes table
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'pending'
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
    await queryInterface.dropTable('Jobs');
  }
};
