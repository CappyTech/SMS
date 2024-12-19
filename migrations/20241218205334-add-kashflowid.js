'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Invoices', 'KashFlowID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'KF_Receipts',
        key: 'InvoiceNumber',
      }
    });
    await queryInterface.addColumn('Quotes', 'KashFlowID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'KF_Receipts',
        key: 'InvoiceNumber',
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Invoices', 'KashFlowID');
    await queryInterface.removeColumn('Quotes', 'KashFlowID');
  }
};
