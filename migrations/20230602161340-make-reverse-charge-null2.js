'use strict';

module.exports = {
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Invoices', 'reverseChargeAmount');
  },
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Invoices', 'reverseCharge', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },
};