'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('module_chapters', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      moduleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'modules', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      slug: { type: Sequelize.STRING(128), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(500), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      // { clientInitials, clientName, clientTitle, objection, objective, criteria[] }
      // — the AI roleplay scenario for this chapter's practice pitch.
      scenario: { type: Sequelize.JSONB, allowNull: false },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('module_chapters', ['moduleId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('module_chapters');
  },
};
