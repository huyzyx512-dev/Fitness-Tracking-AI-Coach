'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscription_plan', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      code: {
        allowNull: false,
        type: Sequelize.STRING(32),
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(120),
      },
      price: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      currency: {
        allowNull: false,
        type: Sequelize.STRING(3),
        defaultValue: 'VND',
      },
      duration_days: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      features: {
        allowNull: true,
        type: Sequelize.JSON,
      },
      is_active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('subscription_plan', ['code'], {
      name: 'subscription_plan_code_uniq',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('subscription_plan');
  },
};
