import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type Sequelize } from 'sequelize';

// One row per (user, material). `completedAt` is the only completion signal
// — no separate status enum that could drift out of sync with it.
export class UserMaterialProgress extends Model<
  InferAttributes<UserMaterialProgress>,
  InferCreationAttributes<UserMaterialProgress>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare materialId: string;
  declare completedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUserMaterialProgressModel(sequelize: Sequelize) {
  UserMaterialProgress.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      materialId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'UserMaterialProgress',
      tableName: 'user_material_progress',
      indexes: [{ unique: true, fields: ['userId', 'materialId'] }],
    }
  );

  return UserMaterialProgress;
}
