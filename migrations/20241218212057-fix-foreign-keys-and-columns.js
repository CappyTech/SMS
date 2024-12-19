'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add foreign key for KF_Invoices -> KF_Customers
    await queryInterface.addConstraint('KF_Invoices', {
      fields: ['CustomerID'],
      type: 'foreign key',
      name: 'fk_invoices_customerid',
      references: {
        table: 'KF_Customers',
        field: 'CustomerID',
      },
    });

    // Add foreign key for KF_Invoices -> KF_Projects
    await queryInterface.addConstraint('KF_Invoices', {
      fields: ['ProjectID'],
      type: 'foreign key',
      name: 'fk_invoices_projectid',
      references: {
        table: 'KF_Projects',
        field: 'ID',
      },
    });

    // Add foreign key for KF_Receipts -> KF_Customers
    await queryInterface.addConstraint('KF_Receipts', {
      fields: ['CustomerID'],
      type: 'foreign key',
      name: 'fk_receipts_customerid',
      references: {
        table: 'KF_Customers',
        field: 'CustomerID',
      },
    });

    // Add foreign key for KF_Receipts -> KF_Projects
    await queryInterface.addConstraint('KF_Receipts', {
      fields: ['ProjectID'],
      type: 'foreign key',
      name: 'fk_receipts_projectid',
      references: {
        table: 'KF_Projects',
        field: 'ID',
      },
    });

    // Add foreign key for KF_Receipts -> KF_Suppliers
    await queryInterface.addConstraint('KF_Receipts', {
      fields: ['SupplierID'],
      type: 'foreign key',
      name: 'fk_receipts_supplierid',
      references: {
        table: 'KF_Suppliers',
        field: 'SupplierID',
      },
    });

    // Add foreign key for KF_Quotes -> KF_Customers
    await queryInterface.addConstraint('KF_Quotes', {
      fields: ['CustomerID'],
      type: 'foreign key',
      name: 'fk_quotes_customerid',
      references: {
        table: 'KF_Customers',
        field: 'CustomerID',
      },
    });

    // Add foreign key for KF_Quotes -> KF_Projects
    await queryInterface.addConstraint('KF_Quotes', {
      fields: ['ProjectID'],
      type: 'foreign key',
      name: 'fk_quotes_projectid',
      references: {
        table: 'KF_Projects',
        field: 'ID',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove constraints
    await queryInterface.removeConstraint('KF_Invoices', 'fk_invoices_customerid');
    await queryInterface.removeConstraint('KF_Invoices', 'fk_invoices_projectid');
    await queryInterface.removeConstraint('KF_Receipts', 'fk_receipts_customerid');
    await queryInterface.removeConstraint('KF_Receipts', 'fk_receipts_projectid');
    await queryInterface.removeConstraint('KF_Receipts', 'fk_receipts_supplierid');
    await queryInterface.removeConstraint('KF_Quotes', 'fk_quotes_customerid');
    await queryInterface.removeConstraint('KF_Quotes', 'fk_quotes_projectid');
  },
};
