'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Attendances', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      date: {
        type: DATEONLY,
        allowNull: false,
      },
      location: {
        type: STRING,
        allowNull: false,
      },
      holidays_taken: {
        type: FLOAT,
        allowNull: true,
      },
      days_without_work: {
        type: FLOAT,
        allowNull: true,
      },
      workerId: {
        type: UUID,
        references: {
          model: 'Workers',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        allowNull: true,
      },
      subcontractorId: {
        type: UUID,
        references: {
          model: 'Subcontractors',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Attendances');
  },
};
