'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Quotes', 'clientId', {
      type: UUID,
      allowNull: false,
      references: {
        model: 'Clients', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.removeColumn('Quotes', 'client');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Quotes', 'client', {
      type: STRING,
      allowNull: true,
    });

    await queryInterface.removeColumn('Quotes', 'clientId');
  }
};
