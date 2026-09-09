'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Null on legacy/seeded materials, which stream the shared demo file
    // (see media.controller.ts). Set when a real file was uploaded through
    // the admin Module Editor — storageKey is the filename under
    // env.UPLOAD_DIR, mimeType is what the browser reported at upload time.
    await queryInterface.addColumn('learning_materials', 'storageKey', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('learning_materials', 'mimeType', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('learning_materials', 'storageKey');
    await queryInterface.removeColumn('learning_materials', 'mimeType');
  },
};
