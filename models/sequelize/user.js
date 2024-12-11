const encryptionService = require('../../services/encryptionService');

// models/user.js
module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define('Users', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('subcontractor', 'employee', 'accountant', 'hmrc', 'admin'),
            defaultValue: 'subcontractor',
            allowNull: false,
        },
        // Foreign key fields to link with other models
        subcontractorId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Subcontractors',
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
        employeeId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Employees',
                key: 'id',
            }
        },
        // Permissions for roles
        permissionCreateUser: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionReadUser: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionUpdateUser: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionDeleteUser: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionCreateSubcontractor: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionReadSubcontractor: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionUpdateSubcontractor: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionDeleteSubcontractor: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionCreateInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionReadInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionUpdateInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionDeleteInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
        /*
        permissionCreateEmployee: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionReadEmployee: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionUpdateEmployee: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionDeleteEmployee: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionCreateVehicle: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionReadVehicle: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionUpdateVehicle: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionDeleteVehicle: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionCreateVehicleCheck: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionReadVehicleCheck: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionUpdateVehicleCheck: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionDeleteVehicleCheck: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionCreateVehicleReceipt: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionReadVehicleReceipt: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionUpdateVehicleReceipt: { type: DataTypes.BOOLEAN, defaultValue: false },
        permissionDeleteVehicleReceipt: { type: DataTypes.BOOLEAN, defaultValue: false },
        */
        // TOTP fields
        totpSecret: {
            type: DataTypes.STRING,
            allowNull: true, // Can be null until TOTP is enabled
            set(value) {
                if (value) {
                    this.setDataValue('totpSecret', encryptionService.encrypt(value));
                }
            },
            get() {
                const encrypted = this.getDataValue('totpSecret');
                return encrypted ? encryptionService.decrypt(encrypted) : null;
            }
        },
        totpEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'latin1',
        collate: 'latin1_bin',
    });

    // Hook to hash the password before creating the user
    Users.beforeCreate(async (user) => {
        if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
        }
        // Ensure only one of these fields is set at a time
        const count = [user.subcontractorId, user.clientId, user.employeeId].filter(id => id !== null).length;
        if (count > 1) {
            throw new Error('User can only be linked to one of subcontractor, client, or employee.');
        }
    });

    // Hook to hash the password before updating the user, if the password is being changed
    Users.beforeUpdate(async (user) => {
        if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
        }
    });

    return Users;
};