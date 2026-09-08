import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute, type Sequelize } from 'sequelize';
import type { LearningMaterial } from './learningMaterial.model';
import type { TrainingModule } from './module.model';

// Mirrors app/lib/modulesData.ts (`PitchScenario`) in the voice-analyzer
// frontend repo — the AI roleplay scenario a rep practices against for this
// chapter.
export type ChapterScenario = {
  clientInitials: string;
  clientName: string;
  clientTitle: string;
  objection: string;
  objective: string;
  criteria: string[];
};

export class ModuleChapter extends Model<InferAttributes<ModuleChapter>, InferCreationAttributes<ModuleChapter>> {
  declare id: CreationOptional<string>;
  declare moduleId: string;
  declare slug: string;
  declare title: string;
  declare description: string;
  declare scenario: ChapterScenario;
  declare order: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Only populated when eager-loaded via `include`.
  declare materials?: NonAttribute<LearningMaterial[]>;
  declare module?: NonAttribute<TrainingModule>;
}

export function initModuleChapterModel(sequelize: Sequelize) {
  ModuleChapter.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      moduleId: {
        type: DataTypes.UUID,
        allowNull: false,
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
      scenario: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'ModuleChapter',
      tableName: 'module_chapters',
    }
  );

  return ModuleChapter;
}
