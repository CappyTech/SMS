'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename the column
    await queryInterface.renameColumn('Subcontractors', 'isGross', 'deduction');

    // Update data type and default value
    await queryInterface.changeColumn('Subcontractors', 'deduction', {
      type: Sequelize.FLOAT, // Use FLOAT for decimal values
      allowNull: false,
      defaultValue: 0.3,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes
    await queryInterface.changeColumn('Subcontractors', 'deduction', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.renameColumn('Subcontractors', 'deduction', 'isGross');
  }
};