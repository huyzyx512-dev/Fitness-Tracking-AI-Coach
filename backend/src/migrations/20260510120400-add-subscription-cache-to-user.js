'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user', 'subscription_tier', {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'FREE',
    });

    await queryInterface.addColumn('user', 'subscription_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user', 'subscription_expires_at');
    await queryInterface.removeColumn('user', 'subscription_tier');
  },
};
