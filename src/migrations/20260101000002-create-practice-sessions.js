'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('practice_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      scenario: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      overallScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      verdict: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      categories: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      transcript: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('practice_sessions', ['userId', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('practice_sessions');
  },
};
