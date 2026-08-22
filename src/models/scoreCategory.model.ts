import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type Sequelize } from 'sequelize';

// An admin-managed scoring category (e.g. "Confidence", "Pacing") that the
// AI marks a pitch on, in addition to the four built-in categories
// (presentation, correctness, pronunciation, soft skills) defined in the
// voice-analyzer frontend's app/lib/analysis.ts. Only active categories
// (GET /api/v1/score-categories) should be included when a pitch is
// scored; inactive ones are kept for history but no longer applied to new
// analyses.
export class ScoreCategory extends Model<InferAttributes<ScoreCategory>, InferCreationAttributes<ScoreCategory>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initScoreCategoryModel(sequelize: Sequelize) {
  ScoreCategory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
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
      modelName: 'ScoreCategory',
      tableName: 'score_categories',
    }
  );

  return ScoreCategory;
}
