'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // One row per announcement, shared by every trainee — not one row per
    // recipient. Keeps writes O(1) when a module is published.
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      // 'module_published' | 'exam_deadline'
      type: { type: Sequelize.STRING(32), allowNull: false },
      title: { type: Sequelize.STRING(500), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      moduleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'modules', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // Set for 'exam_deadline' only.
      examId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'exams', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // Makes creation idempotent so a retried publish or a scheduler
      // re-run can't duplicate a notification, e.g.
      //   module_published:<moduleId>
      //   exam_deadline:<examId>:<dueDate ISO>:<daysBefore>
      // Including dueDate means a rescheduled exam can notify again.
      dedupeKey: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Feed is read newest-first.
    await queryInterface.addIndex('notifications', ['createdAt'], {
      name: 'notifications_created_at_idx',
    });

    // Sparse: a row exists only once a user has read a notification, so
    // absence means unread and new notifications need no per-user fan-out.
    await queryInterface.createTable('user_notification_reads', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      notificationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'notifications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      readAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint('user_notification_reads', {
      fields: ['userId', 'notificationId'],
      type: 'unique',
      name: 'user_notification_reads_user_notification_unique',
    });

    // The unique constraint covers lookups by userId; this covers the
    // notificationId side (cascade deletes, per-notification read counts).
    await queryInterface.addIndex('user_notification_reads', ['notificationId'], {
      name: 'user_notification_reads_notification_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_notification_reads');
    await queryInterface.dropTable('notifications');
  },
};
