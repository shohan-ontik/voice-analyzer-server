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
  // Set together: storageKey is the uploaded file's name under
  // env.UPLOAD_DIR, mimeType is what the browser reported at upload time.
  // Both null on legacy/seeded materials, which stream a shared demo file.
  declare storageKey: CreationOptional<string | null>;
  declare mimeType: CreationOptional<string | null>;
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
      storageKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mimeType: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
