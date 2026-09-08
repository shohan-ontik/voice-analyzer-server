'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // A practice session is a free practice pitch when neither is set, a
    // chapter roleplay when chapterId is set, or a graded exam attempt when
    // examId is set — no separate "kind"/"status" column to keep in sync.
    await queryInterface.addColumn('practice_sessions', 'chapterId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'module_chapters', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addColumn('practice_sessions', 'examId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'exams', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex('practice_sessions', ['chapterId']);
    await queryInterface.addIndex('practice_sessions', ['examId']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('practice_sessions', 'chapterId');
    await queryInterface.removeColumn('practice_sessions', 'examId');
  },
};
