import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type Sequelize } from 'sequelize';

export type UserRole = 'user' | 'admin';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare username: string;
  declare phone: CreationOptional<string | null>;
  declare email: CreationOptional<string | null>;
  declare name: string;
  declare passwordHash: string;
  declare role: UserRole;
  declare isBanned: CreationOptional<boolean>;
  declare tokenVersion: CreationOptional<number>;
  declare mustChangePassword: CreationOptional<boolean>;
  declare lastLoginAt: CreationOptional<Date | null>;
  declare firstLoginAt: CreationOptional<Date | null>;
  declare employeeId: CreationOptional<string | null>;
  declare department: CreationOptional<string | null>;
  declare jobTitle: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  toSafeJSON() {
    return {
      id: this.id,
      username: this.username,
      phone: this.phone,
      email: this.email,
      name: this.name,
      role: this.role,
      isBanned: this.isBanned,
      mustChangePassword: this.mustChangePassword,
      lastLoginAt: this.lastLoginAt,
      firstLoginAt: this.firstLoginAt,
      employeeId: this.employeeId,
      department: this.department,
      jobTitle: this.jobTitle,
      createdAt: this.createdAt,
    };
  }
}

export function initUserModel(sequelize: Sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(32),
        allowNull: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'user',
      },
      isBanned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tokenVersion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      mustChangePassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      firstLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      employeeId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      department: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      jobTitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      hooks: {
        beforeValidate: (user) => {
          if (user.email) {
            user.email = user.email.trim().toLowerCase();
          }
          if (user.username) {
            user.username = user.username.trim().toLowerCase();
          }
          if (user.phone) {
            user.phone = user.phone.trim();
          }
        },
      },
    }
  );

  return User;
}
