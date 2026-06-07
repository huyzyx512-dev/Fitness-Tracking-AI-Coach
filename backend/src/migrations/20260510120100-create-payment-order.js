'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_order', {
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
        onDelete: 'RESTRICT',
      },
      plan_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'subscription_plan', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      provider: {
        allowNull: false,
        type: Sequelize.STRING(32),
        defaultValue: 'sepay',
      },
      order_code: {
        allowNull: false,
        type: Sequelize.STRING(64),
      },
      amount: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 2),
      },
      currency: {
        allowNull: false,
        type: Sequelize.STRING(3),
        defaultValue: 'VND',
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('pending', 'paid', 'expired', 'cancelled', 'failed'),
        defaultValue: 'pending',
      },
      payment_content: {
        allowNull: false,
        type: Sequelize.STRING(64),
      },
      qr_url: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      payment_url: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      bank_account: {
        allowNull: true,
        type: Sequelize.STRING(64),
      },
      bank_name: {
        allowNull: true,
        type: Sequelize.STRING(120),
      },
      account_name: {
        allowNull: true,
        type: Sequelize.STRING(120),
      },
      expires_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      paid_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      raw_provider_data: {
        allowNull: true,
        type: Sequelize.JSON,
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

    await queryInterface.addIndex('payment_order', ['order_code'], {
      name: 'payment_order_code_uniq',
      unique: true,
    });
    await queryInterface.addIndex('payment_order', ['payment_content'], {
      name: 'payment_order_content_uniq',
      unique: true,
    });
    await queryInterface.addIndex('payment_order', ['user_id', 'createdAt'], {
      name: 'payment_order_user_created_idx',
    });
    await queryInterface.addIndex('payment_order', ['status'], {
      name: 'payment_order_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_order');
  },
};
