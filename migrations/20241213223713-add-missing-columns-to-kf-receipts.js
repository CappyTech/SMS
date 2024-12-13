'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn('KF_Receipts', 'SupplierID', {
      type: DataTypes.INTEGER,
      allowNull: true, // Set to `false` if always required
      references: {
        model: 'KF_Suppliers',
        key: 'SupplierID',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Adjust based on requirements
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('KF_Receipts', 'SupplierID');
  },
};