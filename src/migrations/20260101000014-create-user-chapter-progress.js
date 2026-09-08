'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_chapter_progress', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      chapterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'module_chapters', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // Null until the user finishes the chapter's materials + roleplay.
      // Completion is a single fact, not a status enum kept in sync by hand.
      completedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint('user_chapter_progress', {
      fields: ['userId', 'chapterId'],
      type: 'unique',
      name: 'user_chapter_progress_user_chapter_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_chapter_progress');
  },
};
