'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // "Days after enrollment" the exam is due, as authored in the admin
    // Module Editor — distinct from (and independent of) the existing
    // absolute `dueDate` column, which nothing currently sets.
    await queryInterface.addColumn('exams', 'deadlineDays', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('exams', 'deadlineDays');
  },
};
