module.exports = (sequelize, DataTypes) => {
const Jobs = sequelize.define('Jobs', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    job_ref: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    locationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Locations',
            key: 'id',
        }
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Clients',
            key: 'id',
        }
    },
    quoteId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Quotes',
            key: 'id',
        }
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'pending',
    },
    desc: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    completionDate: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    timestamps: true,
    paranoid: true,
    charset: 'latin1',
    collate: 'latin1_bin',
});

return Jobs;
};
