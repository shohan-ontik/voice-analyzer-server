'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('practice_sessions', 'scenario');

    await queryInterface.addColumn('practice_sessions', 'topicId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'topics', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // Snapshot of the topic's name at practice time, so history keeps
    // reading correctly even if the topic is later renamed or deleted.
    await queryInterface.addColumn('practice_sessions', 'topicName', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    });
    await queryInterface.changeColumn('practice_sessions', 'topicName', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.addIndex('practice_sessions', ['topicId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('practice_sessions', 'topicId');
    await queryInterface.removeColumn('practice_sessions', 'topicName');
    await queryInterface.addColumn('practice_sessions', 'scenario', {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: '',
    });
  },
};
