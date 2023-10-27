'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Invoices', 'month', {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    });

    await queryInterface.addColumn('Invoices', 'year', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Invoices', 'month');
    await queryInterface.removeColumn('Invoices', 'year');
  }
};