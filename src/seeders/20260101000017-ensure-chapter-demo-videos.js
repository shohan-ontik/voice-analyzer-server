'use strict';

const { v4: uuidv4 } = require('uuid');

// Every chapter should have a playable video for now, backed by the shared
// placeholder file streamed from GET /media/materials/:materialId/video
// (see media.controller.ts) — there's no per-chapter video production yet.
// Chapters that already seeded a real video material keep it; this only
// fills in the gaps.
module.exports = {
  async up(queryInterface) {
    const [chaptersWithoutVideo] = await queryInterface.sequelize.query(`
      SELECT c.id, c.title
      FROM module_chapters c
      WHERE NOT EXISTS (
        SELECT 1 FROM learning_materials m WHERE m."chapterId" = c.id AND m.type = 'video'
      )
    `);

    if (chaptersWithoutVideo.length === 0) {
      console.log('Chapter demo video seed skipped: every chapter already has a video.');
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert(
      'learning_materials',
      chaptersWithoutVideo.map((chapter) => ({
        id: uuidv4(),
        chapterId: chapter.id,
        type: 'video',
        title: 'অধ্যায় ভূমিকা ভিডিও (Chapter Overview Video)',
        meta: '8 secs',
        filename: 'Demo_Chapter_Overview.mp4',
        order: -1,
        createdAt: now,
        updatedAt: now,
      }))
    );

    console.log(`Added a demo video to ${chaptersWithoutVideo.length} chapter(s).`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('learning_materials', { filename: 'Demo_Chapter_Overview.mp4' });
  },
};
