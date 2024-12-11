'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add SupplierID column for associating Subcontractors with KF_Suppliers
    await queryInterface.addColumn('Subcontractors', 'SupplierID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'KF_Suppliers',
        key: 'SupplierID',
      },
    });
    // Add SupplierID column for associating Invoices with Subcontractors
    await queryInterface.addColumn('Invoices', 'SupplierID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'KF_Suppliers',
        key: 'SupplierID',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove SupplierID column
    await queryInterface.removeColumn('Subcontractors', 'SupplierID');
    // Remove SupplierID column
    await queryInterface.removeColumn('Invoices', 'SupplierID');
  },
};
