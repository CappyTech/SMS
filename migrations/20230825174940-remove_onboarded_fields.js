'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Subcontractors', 'onboardedAt');
    await queryInterface.removeColumn('Subcontractors', 'onboarded');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subcontractors', 'onboardedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('Subcontractors', 'onboarded', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },
};