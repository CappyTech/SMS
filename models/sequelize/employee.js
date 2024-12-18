// models/employees.js
module.exports = (sequelize, DataTypes) => {
  const Employees = sequelize.define('Employees', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactNumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    managerId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'latin1',
    collate: 'latin1_bin',
  });

  Employees.associate = (db) => {
    // Employees -> Attendances
    db.Employees.hasMany(db.Attendances, { foreignKey: 'employeeId', allowNull: false });
    db.Attendances.belongsTo(db.Employees, { foreignKey: 'employeeId', allowNull: false });

    // Employees -> managerId (Self-referencing)
    Employees.hasMany(db.Employees, { foreignKey: 'managerId', allowNull: true });
  };

  return Employees;
};