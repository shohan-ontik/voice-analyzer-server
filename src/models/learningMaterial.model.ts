import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type Sequelize } from 'sequelize';

export type LearningMaterialType = 'video' | 'pdf' | 'audio';

export class LearningMaterial extends Model<InferAttributes<LearningMaterial>, InferCreationAttributes<LearningMaterial>> {
  declare id: CreationOptional<string>;
  declare chapterId: string;
  declare type: LearningMaterialType;
  declare title: string;
  // e.g. "10 mins" for video/audio, "6 pages" for a pdf.
  declare meta: string;
  declare filename: string;
  declare order: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initLearningMaterialModel(sequelize: Sequelize) {
  LearningMaterial.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      chapterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(16),
        allowNull: false,
        validate: { isIn: [['video', 'pdf', 'audio']] },
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      meta: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING(255),
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
      modelName: 'LearningMaterial',
      tableName: 'learning_materials',
    }
  );

  return LearningMaterial;
}
