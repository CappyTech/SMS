'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subcontractors', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn('Subcontractors', 'company', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Subcontractors', 'name');
    await queryInterface.removeColumn('Subcontractors', 'company');
  }
};