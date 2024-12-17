module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('KF_Invoices', 'ReadableString', {
          type: Sequelize.TEXT,
          allowNull: true,
      });
  },

  down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('KF_Invoices', 'ReadableString');
  },
};