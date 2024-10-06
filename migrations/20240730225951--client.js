'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Clients', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: STRING,
        allowNull: false,
      },
      contact: {
        type: STRING,
        allowNull: true,
      },
      email: {
        type: STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: STRING,
        allowNull: true,
      },
      address: {
        type: TEXT,
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
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Clients');
  }
};
