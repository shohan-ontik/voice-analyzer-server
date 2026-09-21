'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING(64),
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(32),
      allowNull: true,
      unique: true,
    });
    // Users are now created with a username + phone instead of an email, so
    // email can no longer be a required field. The column and its unique
    // index are kept for existing rows and any features still reading it.
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    // Backfill a username for pre-existing rows (derived from their email's
    // local part) so nobody who could already log in loses access once
    // login switches to username/phone lookup.
    await queryInterface.sequelize.query(`
      UPDATE users
      SET username = regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_.]', '', 'g')
      WHERE username IS NULL AND email IS NOT NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    });
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'username');
  },
};
