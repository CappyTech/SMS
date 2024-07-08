'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Submissions', 'grossTotal', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
    await queryInterface.addColumn('Submissions', 'labourTotal', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
    await queryInterface.addColumn('Submissions', 'materialTotal', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
    await queryInterface.addColumn('Submissions', 'cisTotal', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
    await queryInterface.addColumn('Submissions', 'netTotal', {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Submissions', 'grossTotal');
    await queryInterface.removeColumn('Submissions', 'labourTotal');
    await queryInterface.removeColumn('Submissions', 'materialTotal');
    await queryInterface.removeColumn('Submissions', 'cisTotal');
    await queryInterface.removeColumn('Submissions', 'netTotal');
  }
};
