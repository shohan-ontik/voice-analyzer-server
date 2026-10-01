'use strict';

const { v4: uuidv4 } = require('uuid');

const CATEGORY_NAMES = ['আত্মবিশ্বাস', 'বলার গতি', 'কণ্ঠস্বর ও প্রাণশক্তি', 'স্পষ্টতা', 'সাবলীলতা'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query('SELECT id FROM score_categories LIMIT 1');
    if (existing.length > 0) {
      console.log('Score category seed skipped: score_categories already exist.');
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert(
      'score_categories',
      CATEGORY_NAMES.map((name) => ({
        id: uuidv4(),
        name,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }))
    );

    console.log(`Seeded ${CATEGORY_NAMES.length} score categories.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('score_categories', { name: CATEGORY_NAMES });
  },
};
