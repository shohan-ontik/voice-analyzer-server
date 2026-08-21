'use strict';

const { v4: uuidv4 } = require('uuid');

// Backfills the four scenarios that were previously hardcoded in the
// voice-analyzer frontend (app/lib/pitch.ts), all sharing the same
// starter passage, so admins have something real to edit immediately.
const SHARED_PASSAGE =
  'আমাদের নতুন প্রোডাক্ট আপনার ব্যবসার কাজ আরও সহজ করে তুলবে। এটি ব্যবহার করা যেমন সহজ, তেমনই কার্যকর। প্রতিদিন হাজারো মানুষ এটি ব্যবহার করে সময় ও খরচ দুটোই বাঁচাচ্ছেন। আজই আমাদের সাথে যুক্ত হয়ে আপনার ব্যবসাকে নিয়ে যান এক নতুন উচ্চতায়।';

const TOPIC_NAMES = ['Cold Call', 'Product Demo', 'Objection Handling', 'Elevator Pitch'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query('SELECT id FROM topics LIMIT 1');
    if (existing.length > 0) {
      console.log('Topic seed skipped: topics already exist.');
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert(
      'topics',
      TOPIC_NAMES.map((name) => ({
        id: uuidv4(),
        name,
        passage: SHARED_PASSAGE,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }))
    );

    console.log(`Seeded ${TOPIC_NAMES.length} topics.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('topics', { name: TOPIC_NAMES });
  },
};
