'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exams', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      // One exam per module — this is the module's final assessment.
      moduleId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'modules', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      slug: { type: Sequelize.STRING(128), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(500), allowNull: false },
      moduleLabel: { type: Sequelize.STRING(500), allowNull: false },
      scenario: { type: Sequelize.TEXT, allowNull: false },
      passMark: { type: Sequelize.INTEGER, allowNull: false },
      dueDate: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('exams');
  },
};
