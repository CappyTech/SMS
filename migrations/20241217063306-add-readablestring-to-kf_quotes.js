module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('KF_Quotes', 'ReadableString', {
          type: Sequelize.TEXT,
          allowNull: true,
      });
  },

  down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('KF_Quotes', 'ReadableString');
  },
};
