'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subcontractors', 'onboardedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('Subcontractors', 'isGross', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Subcontractors', 'onboarded');
    await queryInterface.removeColumn('Subcontractors', 'onboardedAt');
    await queryInterface.removeColumn('Subcontractors', 'isGross');
  },
};