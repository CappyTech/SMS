'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Jobs', 'desc', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Jobs', 'completionDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Jobs', 'desc');
    await queryInterface.removeColumn('Jobs', 'completionDate');
  }
};
