module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('KF_Receipts', 'ReadableString', {
          type: Sequelize.TEXT,
          allowNull: true,
      });
  },

  down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('KF_Receipts', 'ReadableString');
  },
};