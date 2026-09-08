import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute, type Sequelize } from 'sequelize';
import type { ModuleChapter } from './moduleChapter.model';
import type { Exam } from './exam.model';

// A training module: an ordered set of chapters ending in one exam. See
// ModuleChapter and Exam. Module completion is not stored anywhere — it's
// derived per-user from UserChapterProgress + whether the linked Exam has
// been passed (a passing PracticeSession with this module's examId).
export class TrainingModule extends Model<InferAttributes<TrainingModule>, InferCreationAttributes<TrainingModule>> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare title: string;
  declare description: string;
  declare thumbnailUrl: string | null;
  declare order: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Only populated when eager-loaded via `include`.
  declare chapters?: NonAttribute<ModuleChapter[]>;
  declare exam?: NonAttribute<Exam | null>;
}

export function initModuleModel(sequelize: Sequelize) {
  TrainingModule.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      slug: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      thumbnailUrl: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'TrainingModule',
      tableName: 'modules',
    }
  );

  return TrainingModule;
}
