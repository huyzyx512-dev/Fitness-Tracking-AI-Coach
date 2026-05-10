'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentTransaction extends Model {
    static associate(models) {
      PaymentTransaction.belongsTo(models.PaymentOrder, {
        foreignKey: 'payment_order_id',
        as: 'order',
      });
    }
  }

  PaymentTransaction.init(
    {
      provider: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'sepay' },
      provider_transaction_id: { type: DataTypes.STRING(128), allowNull: false },
      payment_order_id: { type: DataTypes.INTEGER, allowNull: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'VND' },
      transaction_time: { type: DataTypes.DATE, allowNull: true },
      raw_payload: { type: DataTypes.JSON, allowNull: true },
    },
    {
      sequelize,
      modelName: 'PaymentTransaction',
      tableName: 'payment_transaction',
      freezeTableName: true,
      indexes: [
        {
          name: 'payment_transaction_provider_txid_uniq',
          unique: true,
          fields: ['provider', 'provider_transaction_id'],
        },
      ],
    },
  );

  return PaymentTransaction;
};
