'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('KF_projects', {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      ID: Sequelize.INTEGER,
      Number: Sequelize.INTEGER,
      Name: Sequelize.STRING,
      Reference: Sequelize.STRING,
      Description: Sequelize.TEXT,
      Date1: Sequelize.DATE,
      Date2: Sequelize.DATE,
      CustomerID: Sequelize.INTEGER,
      Status: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('KF_projects');
  },
};
