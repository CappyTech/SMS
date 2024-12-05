'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('KF_Invoices', 'Lines', {
            type: Sequelize.JSON,
            allowNull: true,
        });
        await queryInterface.addColumn('KF_Quotes', 'Lines', {
            type: Sequelize.JSON,
            allowNull: true,
        });
        await queryInterface.addColumn('KF_Receipts', 'Lines', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('KF_Invoices', 'Lines');
        await queryInterface.removeColumn('KF_Quotes', 'Lines');
        await queryInterface.removeColumn('KF_Receipts', 'Lines');
    },
};
