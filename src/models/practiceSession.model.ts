import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type Sequelize } from 'sequelize';

// Mirrors app/lib/analysis.ts (`AnalysisResult`) and app/lib/pitch.ts
// (`ScenarioKey`) in the voice-analyzer frontend repo. Kept as plain JSONB
// blobs since both arrays are fixed-shape and always read/written as one
// unit with their parent session.
export const SCENARIO_KEYS = ['cold', 'demo', 'objection', 'elevator'] as const;
export type ScenarioKey = (typeof SCENARIO_KEYS)[number];

export type CategoryBreakdown = {
  key: 'presentation' | 'correctness' | 'pronunciation' | 'soft';
  name: string;
  score: number;
  feedback: string;
  tips: string[];
};

export type TranscriptSegment = {
  text: string;
  kind: 'plain' | 'filler' | 'pronunciation';
};

export class PracticeSession extends Model<
  InferAttributes<PracticeSession>,
  InferCreationAttributes<PracticeSession>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare scenario: ScenarioKey;
  declare overallScore: number;
  declare verdict: string;
  declare categories: CategoryBreakdown[];
  declare transcript: TranscriptSegment[];
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initPracticeSessionModel(sequelize: Sequelize) {
  PracticeSession.init(
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
      scenario: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      overallScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      verdict: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      categories: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      transcript: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'PracticeSession',
      tableName: 'practice_sessions',
      indexes: [{ fields: ['userId', 'createdAt'] }],
    }
  );

  return PracticeSession;
}
