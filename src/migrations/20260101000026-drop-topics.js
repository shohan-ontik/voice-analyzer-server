'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('practice_sessions', 'topicId');
    await queryInterface.dropTable('topics');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('topics', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      passage: { type: Sequelize.TEXT, allowNull: false },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addColumn('practice_sessions', 'topicId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'topics', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addIndex('practice_sessions', ['topicId']);
  },
};
