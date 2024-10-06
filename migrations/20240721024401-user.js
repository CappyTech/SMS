'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: STRING,
        allowNull: false,
      },
      role: {
        type: ENUM('subcontractor', 'employee', 'accountant', 'hmrc', 'admin'),
        defaultValue: 'subcontractor',
      },
      permissionCreateUser: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionReadUser: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionUpdateUser: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionDeleteUser: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionCreateSubcontractor: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionReadSubcontractor: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionUpdateSubcontractor: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionDeleteSubcontractor: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionCreateInvoice: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionReadInvoice: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionUpdateInvoice: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionDeleteInvoice: {
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
    await queryInterface.dropTable('Users');
  },
};
