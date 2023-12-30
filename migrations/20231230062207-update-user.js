'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Users', 'permissionUpdateUser', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionDeleteUser', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionCreateSubcontractor', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionReadSubcontractor', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionUpdateSubcontractor', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionDeleteSubcontractor', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionCreateInvoice', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionReadInvoice', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionUpdateInvoice', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionDeleteInvoice', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users', 'permissionUpdateUser'),
      queryInterface.removeColumn('Users', 'permissionDeleteUser'),
      queryInterface.removeColumn('Users', 'permissionCreateSubcontractor'),
      queryInterface.removeColumn('Users', 'permissionReadSubcontractor'),
      queryInterface.removeColumn('Users', 'permissionUpdateSubcontractor'),
      queryInterface.removeColumn('Users', 'permissionDeleteSubcontractor'),
      queryInterface.removeColumn('Users', 'permissionCreateInvoice'),
      queryInterface.removeColumn('Users', 'permissionReadInvoice'),
      queryInterface.removeColumn('Users', 'permissionUpdateInvoice'),
      queryInterface.removeColumn('Users', 'permissionDeleteInvoice'),
    ]);
  }
};