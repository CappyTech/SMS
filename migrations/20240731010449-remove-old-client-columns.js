'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Clients', 'contact');
    await queryInterface.removeColumn('Clients', 'email');
    await queryInterface.removeColumn('Clients', 'phone');
    await queryInterface.removeColumn('Clients', 'address');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Clients', 'contact', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Clients', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    });
    await queryInterface.addColumn('Clients', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Clients', 'address', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }
};
