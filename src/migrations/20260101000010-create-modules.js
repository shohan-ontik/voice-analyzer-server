'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('modules', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      slug: { type: Sequelize.STRING(128), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(500), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      thumbnailUrl: { type: Sequelize.STRING(1000), allowNull: true },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('modules');
  },
};
