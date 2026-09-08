import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type Sequelize } from 'sequelize';

// One row per (user, chapter). `completedAt` is the only completion signal
// — no separate status enum that could drift out of sync with it.
export class UserChapterProgress extends Model<
  InferAttributes<UserChapterProgress>,
  InferCreationAttributes<UserChapterProgress>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare chapterId: string;
  declare completedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUserChapterProgressModel(sequelize: Sequelize) {
  UserChapterProgress.init(
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
      chapterId: {
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
      modelName: 'UserChapterProgress',
      tableName: 'user_chapter_progress',
      indexes: [{ unique: true, fields: ['userId', 'chapterId'] }],
    }
  );

  return UserChapterProgress;
}
