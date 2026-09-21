'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const username = (process.env.SEED_ADMIN_USERNAME || '').trim().toLowerCase();
    const phone = (process.env.SEED_ADMIN_PHONE || '').trim();
    const name = process.env.SEED_ADMIN_NAME || 'Admin';
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!username || !password) {
      console.warn(
        'Skipping admin seed: SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD must be set in the environment.'
      );
      return;
    }

    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE username = :username LIMIT 1',
      { replacements: { username } }
    );

    if (existing.length > 0) {
      console.log(`Admin seed skipped: ${username} already exists.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        username,
        phone: phone || null,
        name,
        passwordHash,
        role: 'admin',
        isBanned: false,
        tokenVersion: 0,
        mustChangePassword: false,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log(`Seeded admin user: ${username}`);
  },

  async down(queryInterface) {
    const username = (process.env.SEED_ADMIN_USERNAME || '').trim().toLowerCase();
    if (!username) return;
    await queryInterface.bulkDelete('users', { username });
  },
};
