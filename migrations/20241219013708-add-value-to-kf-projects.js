'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('KF_Projects', 'Value', {
      type: Sequelize.DECIMAL(10, 2)
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('KF_Projects', 'Value');
  },
};
