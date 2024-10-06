'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Subcontractors', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: STRING,
        allowNull: false,
      },
      company: {
        type: STRING,
        allowNull: false,
      },
      line1: {
        type: STRING,
        allowNull: false,
      },
      line2: {
        type: STRING,
        allowNull: false,
      },
      city: {
        type: STRING,
        allowNull: false,
      },
      county: {
        type: STRING,
        allowNull: false,
      },
      postalCode: {
        type: STRING,
        allowNull: false,
      },
      cisNumber: {
        type: STRING,
        allowNull: true,
        unique: true,
      },
      utrNumber: {
        type: STRING,
        allowNull: true,
        unique: true,
      },
      deduction: {
        type: FLOAT,
        allowNull: false,
      },
      vatNumber: {
        type: STRING,
        allowNull: true,
        unique: true,
      },
      isGross: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isCIS: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isReverseCharge: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable('Subcontractors');
  },
};
