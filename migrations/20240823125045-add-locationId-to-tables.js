'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column exists before adding it
    const tableInfoQuotes = await queryInterface.describeTable('Quotes');
    const tableInfoJobs = await queryInterface.describeTable('Jobs');
    const tableInfoAttendances = await queryInterface.describeTable('Attendances');

    // Add locationId to Quotes table if it doesn't exist
    if (!tableInfoQuotes.locationId) {
      await queryInterface.addColumn('Quotes', 'locationId', {
        type: UUID,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }

    // Add locationId to Jobs table if it doesn't exist
    if (!tableInfoJobs.locationId) {
      await queryInterface.addColumn('Jobs', 'locationId', {
        type: UUID,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }

    // Add locationId to Attendances table if it doesn't exist
    if (!tableInfoAttendances.locationId) {
      await queryInterface.addColumn('Attendances', 'locationId', {
        type: UUID,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }

    // Remove old location string columns
    if (tableInfoQuotes.location) {
      await queryInterface.removeColumn('Quotes', 'location');
    }
    if (tableInfoJobs.location) {
      await queryInterface.removeColumn('Jobs', 'location');
    }
    if (tableInfoAttendances.location) {
      await queryInterface.removeColumn('Attendances', 'location');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse migration: Add back the location strings and remove locationId columns
    await queryInterface.addColumn('Quotes', 'location', {
      type: STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Jobs', 'location', {
      type: STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Attendances', 'location', {
      type: STRING,
      allowNull: true,
    });

    await queryInterface.removeColumn('Quotes', 'locationId');
    await queryInterface.removeColumn('Jobs', 'locationId');
    await queryInterface.removeColumn('Attendances', 'locationId');
  }
};
