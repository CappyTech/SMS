'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
      for (let i = 1; i <= 20; i++) {
        await queryInterface.addColumn('KF_Customers', `ExtraText${i}`, {
            type: Sequelize.TEXT,
            defaultValue: "",
            allowNull: false,
        });
      }
      for (let i = 1; i <= 20; i++) {
        await queryInterface.addColumn('KF_Customers', `CheckBox${i}`, {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
        });
      }
    },

    down: async (queryInterface, Sequelize) => {
      for (let i = 1; i <= 20; i++) {
        await queryInterface.removeColumn('KF_Customers', `ExtraText${i}`);
      }
      for (let i = 1; i <= 20; i++) {
        await queryInterface.removeColumn('KF_Customers', `CheckBox${i}`);
      }
    }
};