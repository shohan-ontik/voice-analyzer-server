'use strict';

const EXAMS_PER_MODULE = 3;
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const examTitleFor = (moduleTitle, order) =>
  `${moduleTitle} — পরীক্ষা ${String(order + 1).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)])}`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;

    // A module now has three exams (ordered 0..2) instead of one, so the
    // one-exam-per-module unique constraint on moduleId has to go.
    await sequelize.query('ALTER TABLE "exams" DROP CONSTRAINT IF EXISTS "exams_moduleId_key"');
    await queryInterface.addColumn('exams', 'order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addIndex('exams', ['moduleId', 'order'], {
      unique: true,
      name: 'exams_module_id_order_unique',
    });

    // Backfill: every existing module gets its missing exams. Existing exams
    // keep their settings and become exam #1; new ones start with an empty
    // scenario (the admin fills it in) and the first exam's pass mark/deadline.
    const [modules] = await sequelize.query('SELECT id, slug, title FROM modules');
    const now = new Date();
    for (const m of modules) {
      const [existing] = await sequelize.query(
        'SELECT id, "passMark", "deadlineDays", "dueDate" FROM exams WHERE "moduleId" = :moduleId ORDER BY "createdAt" ASC',
        { replacements: { moduleId: m.id } }
      );
      for (let order = 0; order < EXAMS_PER_MODULE; order += 1) {
        if (order < existing.length) {
          // eslint-disable-next-line no-await-in-loop
          await sequelize.query('UPDATE exams SET "order" = :order, title = :title WHERE id = :id', {
            replacements: { order, title: examTitleFor(m.title, order), id: existing[order].id },
          });
        } else {
          const base = existing[0];
          // eslint-disable-next-line no-await-in-loop
          await queryInterface.bulkInsert('exams', [
            {
              id: require('crypto').randomUUID(),
              moduleId: m.id,
              slug: `${m.slug}-exam-${order + 1}`,
              title: examTitleFor(m.title, order),
              moduleLabel: m.title,
              scenario: '',
              passMark: base ? base.passMark : 80,
              deadlineDays: base ? base.deadlineDays : null,
              dueDate: base ? base.dueDate : null,
              order,
              createdAt: now,
              updatedAt: now,
            },
          ]);
        }
      }
    }
  },

  async down(queryInterface) {
    // Keep only the first exam per module, then restore the unique constraint.
    await queryInterface.sequelize.query('DELETE FROM exams WHERE "order" > 0');
    await queryInterface.removeIndex('exams', 'exams_module_id_order_unique');
    await queryInterface.removeColumn('exams', 'order');
    await queryInterface.addConstraint('exams', {
      fields: ['moduleId'],
      type: 'unique',
      name: 'exams_moduleId_key',
    });
  },
};
