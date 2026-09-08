'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'employeeId', {
      type: Sequelize.STRING(64),
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('users', 'department', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'jobTitle', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'employeeId');
    await queryInterface.removeColumn('users', 'department');
    await queryInterface.removeColumn('users', 'jobTitle');
  },
};
