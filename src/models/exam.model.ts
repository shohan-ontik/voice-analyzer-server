import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute, type Sequelize } from 'sequelize';
import type { TrainingModule } from './module.model';

// One of a module's three assessments (ordered 0..2 by `order`; unique per
// `moduleId` + `order`). Whether a given user has passed it is not
// stored here: it's derived from whether they have a PracticeSession with
// this examId and an overallScore >= passMark.
export class Exam extends Model<InferAttributes<Exam>, InferCreationAttributes<Exam>> {
  declare id: CreationOptional<string>;
  declare moduleId: string;
  declare slug: string;
  declare title: string;
  declare moduleLabel: string;
  declare order: CreationOptional<number>;
  declare scenario: string;
  declare passMark: number;
  declare dueDate: CreationOptional<Date | null>;
  // "Days after enrollment" this exam is due, as authored in the admin
  // Module Editor. dueDate above is derived from it: set on publish, and
  // shifted when this changes on a published module.
  declare deadlineDays: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Only populated when eager-loaded via `include`.
  declare module?: NonAttribute<TrainingModule>;
}

export function initExamModel(sequelize: Sequelize) {
  Exam.init(
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
      moduleLabel: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      scenario: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      passMark: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deadlineDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Exam',
      tableName: 'exams',
    }
  );

  return Exam;
}
