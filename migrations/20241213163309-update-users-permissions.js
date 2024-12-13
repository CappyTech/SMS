'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add the new permissions field
        await queryInterface.addColumn('Users', 'permissions', {
            type: Sequelize.JSON,
            allowNull: false,
            defaultValue: {}, // Default to an empty object
        });

        // Remove individual permission fields
        const permissionsToRemove = [
            'permissionCreateUser',
            'permissionReadUser',
            'permissionUpdateUser',
            'permissionDeleteUser',
            'permissionCreateSubcontractor',
            'permissionReadSubcontractor',
            'permissionUpdateSubcontractor',
            'permissionDeleteSubcontractor',
            'permissionCreateInvoice',
            'permissionReadInvoice',
            'permissionUpdateInvoice',
            'permissionDeleteInvoice',
        ];

        for (const permission of permissionsToRemove) {
            await queryInterface.removeColumn('Users', permission);
        }
    },

    async down(queryInterface, Sequelize) {
        // Revert: Remove the permissions field
        await queryInterface.removeColumn('Users', 'permissions');

        // Revert: Re-add individual permission fields
        const permissionsToReAdd = [
            'permissionCreateUser',
            'permissionReadUser',
            'permissionUpdateUser',
            'permissionDeleteUser',
            'permissionCreateSubcontractor',
            'permissionReadSubcontractor',
            'permissionUpdateSubcontractor',
            'permissionDeleteSubcontractor',
            'permissionCreateInvoice',
            'permissionReadInvoice',
            'permissionUpdateInvoice',
            'permissionDeleteInvoice',
        ];

        for (const permission of permissionsToReAdd) {
            await queryInterface.addColumn('Users', permission, {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }
    },
};
