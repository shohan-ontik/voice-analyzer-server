'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
    const name = process.env.SEED_ADMIN_NAME || 'Admin';
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn(
        'Skipping admin seed: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in the environment.'
      );
      return;
    }

    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { replacements: { email } }
    );

    if (existing.length > 0) {
      console.log(`Admin seed skipped: ${email} already exists.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        email,
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

    console.log(`Seeded admin user: ${email}`);
  },

  async down(queryInterface) {
    const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
    if (!email) return;
    await queryInterface.bulkDelete('users', { email });
  },
};
