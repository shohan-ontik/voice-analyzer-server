'use strict';

const { v4: uuidv4 } = require('uuid');

// Backfills the four categories that were previously hardcoded in the
// voice-analyzer frontend (app/lib/analysis.ts: CATEGORY_LABELS/
// CATEGORY_ORDER) into score_categories, so all marking dimensions are
// managed uniformly from the admin panel going forward.
const CATEGORY_NAMES = ['Presentation', 'Correctness', 'Pronunciation', 'Soft Skills'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    for (const name of CATEGORY_NAMES) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM score_categories WHERE name = :name LIMIT 1',
        { replacements: { name } }
      );
      if (existing.length > 0) {
        console.log(`Score category seed skipped: "${name}" already exists.`);
        continue;
      }

      await queryInterface.bulkInsert('score_categories', [
        { id: uuidv4(), name, isActive: true, createdAt: now, updatedAt: now },
      ]);
      console.log(`Seeded score category: ${name}`);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('score_categories', { name: CATEGORY_NAMES });
  },
};
