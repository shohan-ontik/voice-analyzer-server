'use strict';

const { v4: uuidv4 } = require('uuid');

// One "module published" notification per module that is currently live
// (isActive), so the notification feed reflects the existing catalogue.
// Idempotent: keyed on the same dedupeKey the app uses for this type, so
// re-running only fills in modules that don't have a notification yet.
// Exam-deadline reminders are not seeded — no exam has a dueDate yet.
// Notification text is Bengali. Module titles are authored as
// "বাংলা (English)", so keep only the Bengali part.
const bengaliTitle = (title) => {
  const trimmed = title.trim();
  const open = trimmed.lastIndexOf('(');
  if (open <= 0 || !trimmed.endsWith(')')) return trimmed;
  return trimmed.slice(0, open).trim() || trimmed;
};

module.exports = {
  async up(queryInterface) {
    const [modules] = await queryInterface.sequelize.query(`
      SELECT id, title, "publishDate", "createdAt"
      FROM modules
      WHERE "isActive" = true
      ORDER BY "order" ASC
    `);

    const [existing] = await queryInterface.sequelize.query(
      `SELECT "dedupeKey" FROM notifications WHERE type = 'module_published'`
    );
    const existingKeys = new Set(existing.map((row) => row.dedupeKey));

    const now = new Date();
    const rows = modules
      .filter((m) => !existingKeys.has(`module_published:${m.id}`))
      .map((m) => {
        // Backdate to the module's publish date when it has one so the
        // feed orders sensibly; otherwise fall back to now.
        const createdAt = m.publishDate ? new Date(`${m.publishDate}T00:00:00.000Z`) : now;
        return {
          id: uuidv4(),
          type: 'module_published',
          title: 'নতুন মডিউল প্রকাশিত হয়েছে',
          body: `"${bengaliTitle(m.title)}" মডিউলটি প্রকাশিত হয়েছে। এখনই শেখা শুরু করুন।`,
          moduleId: m.id,
          examId: null,
          dedupeKey: `module_published:${m.id}`,
          createdAt,
          updatedAt: createdAt,
        };
      });

    if (rows.length === 0) {
      console.log('Module-published notification seed skipped: nothing to add.');
      return;
    }

    await queryInterface.bulkInsert('notifications', rows);
    console.log(`Seeded ${rows.length} module-published notification(s).`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('notifications', { type: 'module_published' });
  },
};
