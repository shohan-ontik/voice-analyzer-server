'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('learning_materials', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      chapterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'module_chapters', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: { type: Sequelize.STRING(16), allowNull: false }, // 'video' | 'pdf' | 'audio'
      title: { type: Sequelize.STRING(500), allowNull: false },
      meta: { type: Sequelize.STRING(64), allowNull: false }, // e.g. "10 mins", "6 pages"
      filename: { type: Sequelize.STRING(255), allowNull: false },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('learning_materials', ['chapterId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('learning_materials');
  },
};
