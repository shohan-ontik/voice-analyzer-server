'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('practice_sessions', 'type', {
      type: Sequelize.ENUM('exam', 'pitch_practice'),
      allowNull: false,
      defaultValue: 'pitch_practice',
    });
    await queryInterface.addColumn('practice_sessions', 'passMark', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 60,
    });

    // Backfill existing rows: derive type from examId, and pull passMark
    // from the linked exam's current pass mark for graded attempts.
    await queryInterface.sequelize.query(
      `UPDATE practice_sessions SET "type" = 'exam' WHERE "examId" IS NOT NULL;`
    );
    await queryInterface.sequelize.query(
      `UPDATE practice_sessions ps
       SET "passMark" = e."passMark"
       FROM exams e
       WHERE ps."examId" = e.id;`
    );

    await queryInterface.addIndex('practice_sessions', ['type']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('practice_sessions', 'passMark');
    await queryInterface.removeColumn('practice_sessions', 'type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_practice_sessions_type";');
  },
};
