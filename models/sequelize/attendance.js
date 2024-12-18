// models/attendance.js
module.exports = (sequelize, DataTypes) => {
    const Attendances = sequelize.define('Attendances', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('off', 'holiday', 'sick', 'work'),
            defaultValue: 'off',
            allowNull: false,
        },
        locationId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: db.Locations,
                key: 'id',
            }
        },
        employeeId: {
            type: DataTypes.UUID,
            allowNull: true, // Make it nullable so it can be either employee or subcontractor
            references: {
                model: db.Employees,
                key: 'id',
            }
        },
        subcontractorId: {
            type: DataTypes.UUID,
            allowNull: true, // Make it nullable so it can be either employee or subcontractor
            references: {
                model: db.Subcontractors,
                key: 'id',
            }
        },
        hoursWorked: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    Attendances.associate = (db) => {
        // Attendances -> Employees
        db.Attendances.belongsTo(db.Employees, { foreignKey: 'employeeId', allowNull: false });
        db.Employees.hasMany(db.Attendances, { foreignKey: 'employeeId', allowNull: false });

        // Attendances -> Subcontractors
        db.Attendances.belongsTo(db.Subcontractors, { foreignKey: 'subcontractorId', allowNull: false });
        db.Subcontractors.hasMany(db.Attendances, { foreignKey: 'subcontractorId', allowNull: false });

        // Attendances -> Locations
        db.Attendances.belongsTo(db.Locations, { foreignKey: 'locationId', allowNull: false });
        db.Locations.hasMany(db.Attendances, { foreignKey: 'locationId', allowNull: false });
    };

    return Attendances;
};
