'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Users', 'permissionCreateUser', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn('Users', 'permissionReadUser', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      // add here rest of your fields in the same way
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users', 'permissionCreateUser'),
      queryInterface.removeColumn('Users', 'permissionReadUser'),
      // remove here rest of your fields in the same way
    ]);
  }
};