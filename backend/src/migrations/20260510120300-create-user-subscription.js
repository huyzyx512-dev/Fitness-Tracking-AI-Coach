'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_subscription', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'user', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      plan_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'subscription_plan', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('active', 'expired', 'cancelled'),
        defaultValue: 'active',
      },
      started_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      expires_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      source_payment_order_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'payment_order', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('user_subscription', ['user_id', 'status'], {
      name: 'user_subscription_user_status_idx',
    });
    await queryInterface.addIndex('user_subscription', ['user_id', 'expires_at'], {
      name: 'user_subscription_user_expires_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_subscription');
  },
};
