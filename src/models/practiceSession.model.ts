import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from 'sequelize';
import type { ModuleChapter } from './moduleChapter.model';
import type { Exam } from './exam.model';

// Mirrors app/lib/analysis.ts (`AnalysisResult`) in the voice-analyzer
// frontend repo. Kept as a plain JSONB blob since it's fixed-shape per
// session and always read/written as one unit with its parent. Categories
// are no longer a fixed enum — each session snapshots whichever
// ScoreCategory rows were active at analysis time, identified by `name`
// only (an admin can rename/deactivate/delete a category later without
// corrupting past results).
export type CategoryBreakdown = {
  name: string;
  score: number;
  feedback: string;
  tips: string[];
};

export type TranscriptSegment = {
  text: string;
  kind: 'plain' | 'filler' | 'pronunciation';
};

export type PracticeSessionType = 'exam' | 'pitch_practice';

export class PracticeSession extends Model<
  InferAttributes<PracticeSession>,
  InferCreationAttributes<PracticeSession>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  // Nullable: SET NULL if the topic is later deleted. `topicName` is a
  // snapshot so history keeps reading correctly either way.
  declare topicId: CreationOptional<string | null>;
  declare topicName: string;
  // Set when this session is a chapter roleplay practice. SET NULL if the
  // chapter is later deleted — the session itself still stands as history.
  declare chapterId: CreationOptional<string | null>;
  // Set when this session is a graded exam attempt (mutually exclusive with
  // chapterId in practice, though not DB-enforced).
  declare examId: CreationOptional<string | null>;
  // Snapshotted at creation from examId (mirrors it, kept as its own column
  // so callers can filter/group without a null check on examId).
  declare type: PracticeSessionType;
  // Snapshot of the pass mark this attempt was judged against: the exam's
  // Exam.passMark at the time for a graded attempt, or the flat pitch-practice
  // pass mark otherwise. Stored per-row so a later admin change to an exam's
  // passMark doesn't retroactively change whether a past attempt passed.
  declare passMark: number;
  declare overallScore: number;
  declare verdict: string;
  declare categories: CategoryBreakdown[];
  declare transcript: TranscriptSegment[];
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Only populated when eager-loaded via `include`.
  declare chapter?: NonAttribute<ModuleChapter | null>;
  declare exam?: NonAttribute<Exam | null>;
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
      topicId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      topicName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      chapterId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      examId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('exam', 'pitch_practice'),
        allowNull: false,
      },
      passMark: {
        type: DataTypes.INTEGER,
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
      indexes: [
        { fields: ['userId', 'createdAt'] },
        { fields: ['topicId'] },
        { fields: ['chapterId'] },
        { fields: ['examId'] },
        { fields: ['type'] },
      ],
    }
  );

  return PracticeSession;
}
