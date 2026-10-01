'use strict';

// Score category names are shown to Bengali-speaking trainees, so existing
// rows seeded with English names are renamed to Bengali. Rows with custom
// (admin-created) names are left untouched.
const RENAMES = [
  ['Confidence', 'আত্মবিশ্বাস'],
  ['Pacing', 'বলার গতি'],
  ['Voice & Energy', 'কণ্ঠস্বর ও প্রাণশক্তি'],
  ['Clarity', 'স্পষ্টতা'],
  ['Fluency', 'সাবলীলতা'],
  ['Presentation', 'উপস্থাপনা'],
  ['Correctness', 'শুদ্ধতা'],
  ['Pronunciation', 'উচ্চারণ'],
  ['Soft Skills', 'সফট স্কিল'],
];

async function rename(queryInterface, pairs) {
  for (const [from, to] of pairs) {
    // name is unique, so skip if the target name is already taken.
    await queryInterface.sequelize.query(
      `UPDATE score_categories SET name = :to, "updatedAt" = NOW()
       WHERE name = :from AND NOT EXISTS (SELECT 1 FROM score_categories WHERE name = :to)`,
      { replacements: { from, to } }
    );
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await rename(queryInterface, RENAMES);
  },

  async down(queryInterface) {
    await rename(queryInterface, RENAMES.map(([en, bn]) => [bn, en]));
  },
};
