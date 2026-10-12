'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // When the module first went live. Unlike the admin-authored publishDate,
    // this is set by the server and backs the one-module-per-month rule.
    await queryInterface.addColumn('modules', 'publishedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Backfill: a module's "module published" notification is created at the
    // moment it's published, so it's the best record of when that happened.
    // Live modules without one fall back to their creation time.
    await queryInterface.sequelize.query(`
      UPDATE modules m
      SET "publishedAt" = COALESCE(
        (SELECT MIN(n."createdAt") FROM notifications n
         WHERE n."moduleId" = m.id AND n.type = 'module_published'),
        CASE WHEN m."isActive" THEN m."createdAt" END
      )
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('modules', 'publishedAt');
  },
};
