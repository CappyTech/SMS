'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('Contacts', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('Contacts', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Contacts', 'note', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('Contacts', 'name');
    await queryInterface.removeColumn('Contacts', 'email');
    await queryInterface.removeColumn('Contacts', 'note');
  }
};
