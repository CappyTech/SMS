'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('subcontractor', 'employee', 'accountant', 'hmrc', 'admin'),
        defaultValue: 'subcontractor',
      },
      permissionCreateUser: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionReadUser: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionUpdateUser: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionDeleteUser: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionCreateSubcontractor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionReadSubcontractor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionUpdateSubcontractor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionDeleteSubcontractor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionCreateInvoice: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionReadInvoice: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionUpdateInvoice: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permissionDeleteInvoice: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  },
};
