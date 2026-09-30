import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type Sequelize } from 'sequelize';

// One row per (user, notification) the user has read. A missing row means
// unread — unread lists are an anti-join against this table.
export class UserNotificationRead extends Model<
  InferAttributes<UserNotificationRead>,
  InferCreationAttributes<UserNotificationRead>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare notificationId: string;
  declare readAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUserNotificationReadModel(sequelize: Sequelize) {
  UserNotificationRead.init(
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
      notificationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'UserNotificationRead',
      tableName: 'user_notification_reads',
      indexes: [
        { unique: true, fields: ['userId', 'notificationId'] },
        { fields: ['notificationId'], name: 'user_notification_reads_notification_idx' },
      ],
    }
  );

  return UserNotificationRead;
}
