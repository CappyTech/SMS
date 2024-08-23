'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Quotes');
  },

  down: async (queryInterface, Sequelize) => {
    // Optionally, re-create the table in the down migration if needed
  }
};
