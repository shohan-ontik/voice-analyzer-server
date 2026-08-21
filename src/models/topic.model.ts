import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type Sequelize } from 'sequelize';

// A Topic is an admin-managed practice scenario: a display name plus the
// Bangla passage reps read aloud. Eventually replaces the hardcoded
// SCENARIOS/PITCH_PASSAGE_BN in the voice-analyzer frontend's
// app/lib/pitch.ts once that app is wired to fetch scenarios from here
// (GET /api/v1/topics) instead of a fixed list.
export class Topic extends Model<InferAttributes<Topic>, InferCreationAttributes<Topic>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare passage: string;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initTopicModel(sequelize: Sequelize) {
  Topic.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      passage: {
        type: DataTypes.TEXT,
        allowNull: false,
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
      modelName: 'Topic',
      tableName: 'topics',
    }
  );

  return Topic;
}
