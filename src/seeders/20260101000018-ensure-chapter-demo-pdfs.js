'use strict';

const { v4: uuidv4 } = require('uuid');

// Same idea as 20260101000017 for video: every chapter should have a
// viewable PDF guide for now, backed by the shared placeholder file
// streamed from GET /media/materials/:materialId/pdf. Chapters that
// already seeded a real pdf material keep it; this only fills in the gaps.
module.exports = {
  async up(queryInterface) {
    const [chaptersWithoutPdf] = await queryInterface.sequelize.query(`
      SELECT c.id, c.title
      FROM module_chapters c
      WHERE NOT EXISTS (
        SELECT 1 FROM learning_materials m WHERE m."chapterId" = c.id AND m.type = 'pdf'
      )
    `);

    if (chaptersWithoutPdf.length === 0) {
      console.log('Chapter demo PDF seed skipped: every chapter already has a guide.');
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert(
      'learning_materials',
      chaptersWithoutPdf.map((chapter) => ({
        id: uuidv4(),
        chapterId: chapter.id,
        type: 'pdf',
        title: 'অধ্যায় গাইড (Chapter Guide)',
        meta: '1 page',
        filename: 'Demo_Chapter_Guide.pdf',
        order: 99,
        createdAt: now,
        updatedAt: now,
      }))
    );

    console.log(`Added a demo PDF guide to ${chaptersWithoutPdf.length} chapter(s).`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('learning_materials', { filename: 'Demo_Chapter_Guide.pdf' });
  },
};
