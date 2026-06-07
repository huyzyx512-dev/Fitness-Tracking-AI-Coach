'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_transaction', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      provider: {
        allowNull: false,
        type: Sequelize.STRING(32),
        defaultValue: 'sepay',
      },
      provider_transaction_id: {
        allowNull: false,
        type: Sequelize.STRING(128),
      },
      payment_order_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'payment_order', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      transaction_time: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      raw_payload: {
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

    await queryInterface.addIndex(
      'payment_transaction',
      ['provider', 'provider_transaction_id'],
      {
        name: 'payment_transaction_provider_txid_uniq',
        unique: true,
      },
    );
    await queryInterface.addIndex('payment_transaction', ['payment_order_id'], {
      name: 'payment_transaction_order_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_transaction');
  },
};
