import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute, type Sequelize } from 'sequelize';
import type { TrainingModule } from './module.model';

export type NotificationType = 'module_published' | 'exam_deadline';

// A single announcement shared by every trainee. Read state is per-user and
// lives in UserNotificationRead (no row = unread), so publishing a module
// writes one Notification row regardless of how many users exist.
export class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
  declare id: CreationOptional<string>;
  declare type: NotificationType;
  declare title: string;
  declare body: string;
  declare moduleId: string;
  declare examId: CreationOptional<string | null>;
  // Unique — lets callers "create if not exists" safely. See the migration
  // for the key formats.
  declare dedupeKey: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Only populated when eager-loaded via `include`.
  declare module?: NonAttribute<TrainingModule>;
}

export function initNotificationModel(sequelize: Sequelize) {
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      moduleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      examId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      dedupeKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      indexes: [{ fields: ['createdAt'], name: 'notifications_created_at_idx' }],
    }
  );

  return Notification;
}
